const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const config = require('config');
const {subredditSchema} = require('./subreddit');
const {postSchema} = require('./posts');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required:true,
        minlength: 3,
        maxlength:50
    },
    email: {
        type:String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },karma: {
        type: Number,
        default: 1
    },joined: {
        type: Date,
        default: Date.now
    },subscribedTo:{
        type: [mongoose.Types.ObjectId],
        ref: "Subreddit",
        default: [],
    },postsPublished:{
        type: [postSchema],
        default: []
    },postsInteractedWith:{
        type: [postSchema],
        default: []
    }
});

userSchema.methods.generateAuthToken = function (){
    return jwt.sign({
        _id: this._id,
        name: this.name,
        email: this.email,
        karma: this.karma
    },config.get('jwtPrivateKey'));
}

const User = mongoose.model("User",userSchema);

function validateUser(user){
    const schema =Joi.object( {
        name: Joi.string()
            .min(3)
            .max(50)
            .required(),
        email: Joi.string()
            .min(5)
            .max(255)
            .required()
            .email(),
        password: Joi.string()
            .min(5)
            .max(255)
            .required()
    })
    return schema.validate(user);
}
exports.User = User
exports.validateUser = validateUser;