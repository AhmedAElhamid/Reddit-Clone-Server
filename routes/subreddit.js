const {Subreddit,validateSubreddit} = require('../models/subreddit');
const {User} = require('../models/user')
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const express = require('express');
const router = express.Router();
const paginate = require('express-paginate');


router.get("/",auth,async (req,res)=>{

    try {
        const [ results, itemCount ] = await Promise.all([
            Subreddit.find({}).limit(req.query.limit).skip(req.skip).lean().exec(),
            Subreddit.count({})
        ]);

        const pageCount = Math.ceil(itemCount / req.query.limit);

        if (req.accepts('json')) {
            res.json({
                object: 'list',
                has_more: paginate.hasNextPages(req)(pageCount),
                data: results
            });
        } else {
            res.send( {
                users: results,
                pageCount,
                itemCount,
                pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
            });
        }

    } catch (err) {
        next(err);
    }
})

router.get("/me",auth,async(req,res)=>{
    const id = req.user._id;

    let user = await User.findById(id)
        .populate('subscribedTo','name -_id')
        .exec()

    return res.send(user.subscribedTo);
})

router.get("/:id",[auth,validateObjectId],async(req,res)=>{
    const id = req.params.id;

    let subredditInDb = await Subreddit.findById(id)

    if(!subredditInDb) return res.status(404).send("subreddit not found");

    return res.send(subredditInDb);
})

router.post("/",auth,async(req,res)=>{
    const {error} = validateSubreddit(req.body);
    if(error) return res.status(400).send(error.details.map( e => (e.message)).join('\n'));

    let subreddit = new Subreddit(req.body);
    subreddit.createdBy = req.user._id;
    subreddit = await subreddit.save();

    return res.send(subreddit);
})

router.put("/subscribe/:id",[auth,validateObjectId],async(req,res)=>{
    const id = req.params.id;
    let subreddit = await Subreddit.findById(id);

    if(!subreddit) return res.status(404).send("subreddit not found");

    if(subreddit.subscribers.includes(req.user._id)) return res.status(400).send('user already subscribed to this subreddit');

    subreddit = await Subreddit.findByIdAndUpdate(id,
        {$inc: {'subscriptions' : 1},
            $addToSet:{'subscribers':req.user._id}},{new : true,useFindAndModify:false}).exec();
    await User.findByIdAndUpdate(req.user._id,
        {$addToSet:{'subscribedTo':id}},{new : true,useFindAndModify:false}).exec();

    return res.send(subreddit);
})

router.put("/unsubscribe/:id",[auth,validateObjectId],async(req,res)=>{
    const id = req.params.id;
    let subreddit = await Subreddit.findById(id);

    if(!subreddit) return res.status(404).send("subreddit not found");

    if(!subreddit.subscribers.includes(req.user._id)) return res.status(400).send('user already unSubscribed to this subreddit');

    subreddit = await Subreddit.findByIdAndUpdate(id,
        {$inc: {'subscriptions' : -1},
            $pull:{'subscribers':req.user._id}},{new : true,useFindAndModify:false}).exec();

    return res.send(subreddit);
})

router.put("/:id",[auth,validateObjectId],async(req,res)=>{
    const {error} = validateSubreddit(req.body);
    if(error) return res.status(400).send(error.details.map( e => (e.message)).join('\n'));

    const id = req.params.id;

    let subredditInDb = await Subreddit.findById(id)

    if(!subredditInDb) return res.status(404).send("subreddit not found");
    if(subredditInDb.createdBy.toString() !== req.user._id) return res.status(401).send("you don't have permission to do this action");

    await subredditInDb.set({...req.body}).save();

    return res.send(subredditInDb);
})

router.delete("/:id",[auth,validateObjectId],async(req,res)=>{
    const id = req.params.id;

    let subredditInDb = await Subreddit.findById(id)

    if(!subredditInDb) return res.status(404).send("subreddit not found");
    if(subredditInDb.createdBy.toString() !== req.user._id) return res.status(401).send("you don't have permission to do this action");

    const deleted = await Subreddit.findByIdAndDelete(id);

    return res.send(deleted);
})

module.exports = router;