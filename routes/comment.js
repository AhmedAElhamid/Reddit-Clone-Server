const {Subreddit} = require('../models/subreddit');
const {User} = require('../models/user');
const {validateComment} = require('../models/comment');
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')
const {getAuthor} = require('../util/postsInteractionsHelperMethods')

// get comments in a post
router.get("/:subredditId/:id",[auth,validateObjectId],async (req,res)=>{
    const subredditId = req.params.subredditId
    const postId = req.params.id

    const subreddit = await Subreddit.find({_id:subredditId},{
        postsPublished:{$elemMatch: {_id:postId}}
    })
     if(!subreddit || !subreddit.length) return res.status(404)
        .send("subreddit not found")

    const posts = subreddit[0].postsPublished
    if(!posts.length) return res.status(404)
        .send("post not found in the provided subreddit")

    res.send(posts[0].comments);
})

// add comment to post
router.post("/:subredditId/:id",[auth,validateObjectId],async (req,res)=>{
    const postId = req.params.id;
    const subredditId = req.params.subredditId;
    let comment = {}
    comment.content = req.body.content;
    comment.publisher = req.user._id;

    const {error} = validateComment(comment);
    if(error) return res.status(400).send(error.details.map( e => (e.message)).join('\n'));

    comment._id = new mongoose.mongo.ObjectId();

    const updated = await Subreddit.findOneAndUpdate({_id:subredditId,
        postsPublished:{ $elemMatch :{_id:postId}}},{
        $addToSet : {"postsPublished.$.comments": comment},
    },{new:true,useFindAndModify:false});

    if(!updated || !updated.postsPublished.length) res.status(404).send("post in the provided subreddit not found")

    await User.findOneAndUpdate({_id:getAuthor(updated),
        postsPublished:{ $elemMatch :{_id:postId}}},{
        $addToSet : {"postsPublished.$.comments": comment}
        },{new:true,useFindAndModify:false})

    comment = updated.postsPublished
        .filter(p => p._id.toString() === postId)[0]
        .comments.filter(c => c._id.toString() === comment._id.toString())[0]

    return res.send(comment)
})

// //update comment
router.put("/:subredditId/:postId/:id",[auth,validateObjectId],async (req,res)=>{
    const postId = req.params.postId;
    const subredditId = req.params.subredditId;
    const commentId = req.params.id;
    const userId = req.user._id;
    let comment = {}
    comment.content = req.body.content;

    const subreddit = await Subreddit.findOne({_id:subredditId},{
        "postsPublished": {$elemMatch: {_id: postId}}})
    if(!subreddit || !subreddit.postsPublished.length) return res.status(404).send("post in the provided subreddit not found");

    const postInDb = subreddit.postsPublished[0];

    postInDb.comments = postInDb.comments
        .map(c => {
            if(c._id.toString() === commentId) {
                if(c.publisher.toString() !== userId) return res
                    .status(401).send("you don't have permission to modify this comment")
                c.content = comment.content
                c.publishedAt = Date.now()
                comment = c;
            }
            return c
        })
    console.log(postInDb.comments)

    if(!comment.publishedAt) return res.status(404)
        .send("comment not found");

    const updated = await Subreddit.findOneAndUpdate({_id:subredditId,
        "postsPublished": {$elemMatch: {_id: postId}}},
        {
            $set:{"postsPublished.$":postInDb}
        })

    await User.findOneAndUpdate({_id:getAuthor(updated),
            "postsPublished": {$elemMatch: {_id: postId}}},
        {
            $set:{"postsPublished.$":postInDb}
        })

    return res.send(postInDb)
})

// remove comment
router.delete("/:subredditId/:postId/:id",[auth,validateObjectId],async (req,res)=>{
    const postId = req.params.postId;
    const subredditId = req.params.subredditId;
    const commentId = req.params.id;
    const userId = req.user._id

    const subreddit = await Subreddit.findOne({_id:subredditId,
        postsPublished:{ $elemMatch :{_id:postId}}});

    if(!subreddit || !subreddit.postsPublished.length) return res.status(404).send("the post in the provided subreddit not found")
    subreddit.postsPublished[0].comments = subreddit.postsPublished[0].comments
        .filter(c => c._id.toString()===commentId)

    if(!subreddit.postsPublished[0].comments.length) return res.status(404)
        .send("the comment in the provided subreddit and post not found")

    if(subreddit.postsPublished[0].comments[0].publisher.toString() !== userId) return res
        .status(401).send("you don't have permission to delete this comment")

    const updated = await Subreddit.findOneAndUpdate({_id:subredditId,
        postsPublished:{ $elemMatch :{_id:postId}}},{
        $pull : {"postsPublished.$.comments": {_id:commentId}}
    },{new:true,useFindAndModify:false});

    await User.findOneAndUpdate({_id:getAuthor(updated),
        postsPublished:{ $elemMatch :{_id:postId}}},{
        $pull : {"postsPublished.$.comments": {_id:commentId}}
    },{new:true,useFindAndModify:false})

    return res.send(updated)
})

//upvote comment
router.put("/upvote/:subredditId/:postId/:id",[auth,validateObjectId],async (req,res)=>{
    const postId = req.params.postId;
    const subredditId = req.params.subredditId;
    const commentId = req.params.id;
    const userId = req.user._id;
    let comment = {}

    const subreddit = await Subreddit.findOne({_id:subredditId},{
        "postsPublished": {$elemMatch: {_id: postId}}})

    if(!subreddit || !subreddit.postsPublished.length) return res.status(404).send("post in the provided subreddit not found");

    const postInDb = subreddit.postsPublished[0];

    postInDb.comments = postInDb.comments
        .map(c => {
            if(c._id.toString() === commentId) {
                if(c.usersUpVoted.includes(userId)) return res.status(400)
                    .send("comment already upvoted")
                if(c.usersDownVoted.includes(userId)){
                    --c.downVotes
                    c.usersDownVoted = c.usersDownVoted.filter(u => u.toString()!==userId)
                }
                ++c.upVotes
                c.usersUpVoted.push(userId)
                comment = c;
            }
            return c
        })

    if(!comment.upVotes) return res.status(404)
        .send("comment not found");

    const updated = await Subreddit.findOneAndUpdate({_id:subredditId,
            "postsPublished": {$elemMatch: {_id: postId}}},
        {
            $set:{"postsPublished.$":postInDb}
        })

    await User.findOneAndUpdate({_id:getAuthor(updated),
            "postsPublished": {$elemMatch: {_id: postId}}},
        {
            $set:{"postsPublished.$":postInDb}
        })

    return res.send(postInDb)
})

//downvote comment
router.put("/downvote/:subredditId/:postId/:id",[auth,validateObjectId],async (req,res)=>{
    const postId = req.params.postId;
    const subredditId = req.params.subredditId;
    const commentId = req.params.id;
    const userId = req.user._id;
    let comment = {}

    const subreddit = await Subreddit.findOne({_id:subredditId},{
        "postsPublished": {$elemMatch: {_id: postId}}})

    if(!subreddit || !subreddit.postsPublished.length) return res.status(404).send("post in the provided subreddit not found");

    const postInDb = subreddit.postsPublished[0];

    postInDb.comments = postInDb.comments
        .map(c => {
            if(c._id.toString() === commentId) {
                if(c.usersDownVoted.includes(userId)) return res.status(400)
                    .send("comment already downvoted")
                if(c.usersUpVoted.includes(userId)){
                    --c.upVotes
                    c.usersUpVoted = c.usersUpVoted.filter(u => u.toString()!==userId)
                }
                ++c.downVotes
                c.usersDownVoted.push(userId)
                comment = c;
            }
            return c
        })

    if(!comment.downVotes) return res.status(404)
        .send("comment not found");

    const updated = await Subreddit.findOneAndUpdate({_id:subredditId,
            "postsPublished": {$elemMatch: {_id: postId}}},
        {
            $set:{"postsPublished.$":postInDb}
        })

    await User.findOneAndUpdate({_id:getAuthor(updated),
            "postsPublished": {$elemMatch: {_id: postId}}},
        {
            $set:{"postsPublished.$":postInDb}
        })

    return res.send(postInDb)
})

module.exports = router;