const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const {commentSchema} = require('./comment');

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required:true,
        minlength: 1,
        maxlength:1024
    },
    publisher: {
        type: mongoose.Types.ObjectId,
        ref:"User",
        required: true
    },publishedTo: {
        type: mongoose.Types.ObjectId,
        ref:"Subreddit",
        required: true
    },publishedAt:{
        type:Date,
        default:Date.now
    },upVotes:{
        type:Number,
        default:0
    },downVotes:{
        type:Number,
        default:0
    },usersUpVoted:{
      type:[mongoose.Types.ObjectId],
      ref:"User",
      default:[]
    },usersDownVoted:{
      type:[mongoose.Types.ObjectId],
      ref:"User",
      default:[]
    },comments:{
        type:[commentSchema],
        default:[]
    },interaction:{
        isUpVoted:{
            type:Boolean,
            default:false
        },isDownVoted:{
            type:Boolean,
            default:false
        }
    }
} );

function validatePost(post){
    const schema = Joi.object({
        content: Joi.string()
            .min(1)
            .required()
        ,
        publisher: Joi.objectId()
            .required()
        ,publishedTo: Joi.objectId()
            .required()
    })
    return schema.validate(post);
}
exports.postSchema = postSchema
exports.validatePost = validatePost;