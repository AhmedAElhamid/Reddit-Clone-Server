const {Subreddit} = require('../models/subreddit');
const {User} = require('../models/user');
const {validatePost} = require('../models/posts');
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const express = require('express');
const router = express.Router();
const paginate = require('express-paginate');
const mongoose = require('mongoose')
const interactionWithPost = require('../middleware/interactionWithPost');
const {userFilter,subredditFilter, upVotingUpdates,
    upVotingADownVotedPostUpdates, downVotingAnUpVotedPostUpdates,
    downVotingUpdates, getAuthor, wasDownVoted, wasUpVoted} = require("../util/postsInteractionsHelperMethods");

// get all posts for a user
router.get("/user",auth,async (req,res)=>{
    const userId = req.user._id;
    const user = await User.findById(userId);
    const itemCount = user.postsPublished.length
    try {
        const results = await User.findById(userId,
            {"postsPublished":{ $slice:[req.skip,req.query.limit]}})
                .select("postsPublished -_id")
                .lean()
                .exec();

        if(itemCount === 0) return res.status(404).send("no posts found");

        const pageCount = Math.ceil(itemCount / req.query.limit);

        if (req.accepts('json')) {
            res.json({
                object: 'list',
                has_more: paginate.hasNextPages(req)(pageCount),
                data: interactionWithPost(results.postsPublished)
            });
        } else {
            res.send( {
                users: interactionWithPost(results.postsPublished),
                pageCount,
                itemCount,
                pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
            });
        }

    } catch (err) {
        throw err;
    }
})

// get a post given by id from a user
router.get("/user/:id",[auth,validateObjectId],async (req,res)=>{
    const userId = req.user._id;
    const postId = req.params.id;

    const user = await User.findById(userId)

    const post = user.postsPublished.filter(p => p.id === postId)[0];

    if(!post) return res.status(404).send("post not found");

    return res.send(interactionWithPost(post)[0])
})

// get all posts from a subreddit
router.get("/subreddit/:subredditId",auth,async (req,res)=>{
    const subredditId = req.params.subredditId;
    if (!mongoose.Types.ObjectId.isValid(subredditId)) return res.status(404).send('Invalid ID.');

    const subreddit = await Subreddit.findById(subredditId);
    const itemCount = subreddit.postsPublished.length
    try {
        const results = await Subreddit.findById(subredditId,
            {"postsPublished":{ $slice:[req.skip,req.query.limit]}})
            .select("postsPublished -_id")
            .lean()
            .exec();

        if(itemCount === 0) return res.status(404).send("no posts found");

        const pageCount = Math.ceil(itemCount / req.query.limit);

        if (req.accepts('json')) {
            res.json({
                object: 'list',
                has_more: paginate.hasNextPages(req)(pageCount),
                data: interactionWithPost(results.postsPublished)
            });
        } else {
            res.send( {
                users: interactionWithPost(results.postsPublished),
                pageCount,
                itemCount,
                pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
            });
        }

    } catch (err) {
        throw err;
    }
})

// get a post given by id from a subreddit
router.get("/subreddit/:subredditId/:id",[auth ,validateObjectId],async (req,res)=>{
    const subredditId = req.params.subredditId;

    if (!mongoose.Types.ObjectId.isValid(subredditId)) return res.status(404).send('Invalid ID.');

    const postId = req.params.id;

    const subreddit = await Subreddit.findById(subredditId)

    if(!subreddit) return res.status(404).send('subreddit with the given id not found')

    const post = subreddit.postsPublished.filter(p => p.id === postId)[0];

    if(!post) return res.status(404).send("post not found");

    return res.send(interactionWithPost(post)[0])
})

// add a new post to a user and a subreddit
router.post("/:id",[auth,validateObjectId],async (req,res)=>{
    const id = req.params.id;

    const post = req.body;
    post.publisher = req.user._id;
    post.publishedTo = id;

    const {error} = validatePost(req.body);
    if(error) return res.status(400).send(error.details.map( e => (e.message)).join('\n'));

    post._id = new mongoose.mongo.ObjectId();

    const user = await User.findOneAndUpdate({_id:req.user._id},{
        $addToSet:{postsPublished:post}
    },{useFindAndModify:false})

    if(!user) res.status(404).send("user with the given token is not found")

    const subreddit = await Subreddit.findOneAndUpdate({_id:id},{
        $addToSet:{postsPublished:post}
    },{useFindAndModify:false})

    if(!subreddit) res.status(404).send("subreddit with the given id not found")


    return res.send(post);
})

// update a post in the user and subreddit collections
router.put("/:id",[auth,validateObjectId],async (req,res)=>{
    const id = req.params.id;
    let {content} = req.body;

    if(!content) res.status(400).send("post content is empty");

    const user = await User.findOneAndUpdate({_id: req.user._id,
     postsPublished:{ $elemMatch :{_id:id}}},{$set :{"postsPublished.$.content":content}},
        {useFindAndModify:false});

    if(!user) return res.status(404).send('post not found')

    const postInDb = user.postsPublished.filter(p => p._id.toString() === id)[0];

    await Subreddit.findOneAndUpdate({_id: postInDb.publishedTo,
            postsPublished:{ $elemMatch :{_id:id}}},{$set :{"postsPublished.$.content":content}},
        {useFindAndModify:false});

    return res.send(interactionWithPost(postInDb));
})

// delete a post in the user and subreddit collections
router.delete("/:id",[auth,validateObjectId],async (req,res)=>{
    const id = req.params.id;

    const user = await User.findById(req.user._id)

    const postInDb = user.postsPublished.filter(p => p._id.toString() === id)[0];

    if(!postInDb) return res.status(404).send("post not found")

    await User.findOneAndUpdate({_id: req.user._id},
        {$pull: {postsPublished:{_id:id}}},
        {useFindAndModify:false});

    await Subreddit.findOneAndUpdate({_id: postInDb.publishedTo},
        {$pull: {postsPublished:{_id:id}}},
        {useFindAndModify:false});


    return res.send(postInDb);
})

// upvote post
router.post("/upvote/:subreddit/:id",[auth,validateObjectId],async (req,res)=> {
    const id = req.params.id;
    const subredditId = req.params.subreddit;
    const userId = req.user._id;
    let updated;

    const subreddit = await Subreddit.find(subredditFilter(subredditId,id))

    if (!subreddit.length) return res.status(404).send("post not found in the provided subreddit id")

    if (wasUpVoted(subreddit,userId)) {
        return res.status(400).send("post already upvoted");
    } else if (wasDownVoted(subreddit,userId)) {
        updated = await Subreddit.findOneAndUpdate(subredditFilter(subredditId,id),
            upVotingADownVotedPostUpdates(userId), {new:true,useFindAndModify:false});
        await User.findOneAndUpdate(userFilter(getAuthor(updated),id),
            upVotingADownVotedPostUpdates(userId),{new:true,useFindAndModify:false});
    } else {
        updated = await Subreddit.findOneAndUpdate(subredditFilter(subredditId,id),
            upVotingUpdates(userId),{new:true,useFindAndModify:false});
        await User.findOneAndUpdate(userFilter(getAuthor(updated),id),
            upVotingUpdates(userId),{new:true,useFindAndModify:false});
    }
    return res.send(updated);
})

// downvote post
router.post("/downvote/:subreddit/:id",[auth,validateObjectId],async (req,res)=>{
    const id = req.params.id;
    const subredditId = req.params.subreddit;
    const userId = req.user._id;
    let updated;

    const subreddit = await Subreddit.find(subredditFilter(subredditId,id))
    if(!subreddit.length) return res.status(404).send("post not found in the provided subreddit id")

    if (wasDownVoted(subreddit,userId)) {
        return res.status(400).send("post already downvoted");
    } else if (wasUpVoted(subreddit,userId)) {
        updated = await Subreddit.findOneAndUpdate(subredditFilter(subredditId,id),
            downVotingAnUpVotedPostUpdates(userId), {new:true,useFindAndModify:false});
        await User.findOneAndUpdate(userFilter(getAuthor(updated),id),
            downVotingAnUpVotedPostUpdates(userId),{new:true,useFindAndModify:false});
    } else {
        updated = await Subreddit.findOneAndUpdate(subredditFilter(subredditId,id),
            downVotingUpdates(userId),{new:true,useFindAndModify:false});
        await User.findOneAndUpdate(userFilter(getAuthor(updated),id),
            downVotingUpdates(userId),{new:true,useFindAndModify:false});
    }
    return res.send(updated);
})


module.exports = router;
