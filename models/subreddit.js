const mongoose = require('mongoose');
const Joi = require('joi');
const {postSchema} = require('./posts');

const subredditSchema = new mongoose.Schema({
    name: {
        type: String,
        required:true,
        minlength: 3,
        maxlength:50
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref:"User",
        required: true
    },
    bio: {
        type:String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },
    subscriptions: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    postsPublished:{
        type:[postSchema],
        default: [],
    },subscribers:{
        type: [mongoose.Types.ObjectId],
        ref:"User",
        default:[]
    }
});

const Subreddit = mongoose.model("Subreddit",subredditSchema);

function validateSubreddit(subreddit){
    const schema =Joi.object( {
        name: Joi.string()
            .min(3)
            .max(50)
            .required(),
        bio: Joi.string()
            .min(5)
            .max(1024)
            .required()
    })
    return schema.validate(subreddit);
}
exports.Subreddit = Subreddit;
exports.subredditSchema = subredditSchema;
exports.validateSubreddit = validateSubreddit;