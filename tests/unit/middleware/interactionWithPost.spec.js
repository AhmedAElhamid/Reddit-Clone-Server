const mongoose = require('mongoose');
const interactionWithUser = require("../../../middleware/interactionWithPost");

describe("interaction with user",()=>{
    const userId = new mongoose.mongo.ObjectId();
    let usersUpVoted = [];
    let usersDownVoted = [];
    for(let i=0;i<3;i++){
        usersUpVoted.push(new mongoose.mongo.ObjectId());
    }
    for(let i=0;i<3;i++){
        usersDownVoted.push(new mongoose.mongo.ObjectId());
    }
    const postUpVoted = {
        content : "content",
        publisher: new mongoose.mongo.ObjectId(),
        publishedTo: new mongoose.mongo.ObjectId(),
        usersUpVoted : [...usersUpVoted,userId],
        usersDownVoted : [...usersDownVoted],
        interaction :{
            isUpVoted:false,
            isDownVoted:false
        }
    }
    const postDownVoted = {
        content : "content",
        publisher: new mongoose.mongo.ObjectId(),
        publishedTo: new mongoose.mongo.ObjectId(),
        usersUpVoted : [...usersUpVoted],
        usersDownVoted : [...usersDownVoted,userId],
        interaction :{
            isUpVoted:false,
            isDownVoted:false
        }
    }
    const postNotInteractedWith = {
        content : "content",
        publisher: new mongoose.mongo.ObjectId(),
        publishedTo: new mongoose.mongo.ObjectId(),
        usersUpVoted : [...usersUpVoted],
        usersDownVoted : [...usersDownVoted],
        interaction :{
            isUpVoted:false,
            isDownVoted:false
        }
    }
    test('should return posts with interaction upVoted if user upVoted the post',()=>{
        const post = interactionWithUser([postUpVoted],userId);

        expect(post[0].interaction.isUpVoted).toBeTruthy()
        expect(post[0].interaction.isDownVoted).toBeFalsy()
    })
    test('should return posts with interaction downVoted if user downVoted the post',()=>{
        const post = interactionWithUser([postDownVoted],userId);

        expect(post[0].interaction.isUpVoted).toBeFalsy()
        expect(post[0].interaction.isDownVoted).toBeTruthy()
    })
    test('should return posts with no interaction if user not interacted with it',()=>{
        const post = interactionWithUser([postNotInteractedWith],userId);

        expect(post[0].interaction.isUpVoted).toBeFalsy()
        expect(post[0].interaction.isDownVoted).toBeFalsy()
    })
})