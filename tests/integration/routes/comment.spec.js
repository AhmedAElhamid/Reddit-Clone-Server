const {Subreddit} = require('../../../models/subreddit');
const {User} = require('../../../models/user');
const request = require('supertest');
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken');
const config = require('config');

describe('comment route',()=>{
    let server;

    beforeEach(()=>{
        server = require('../../../server');
    })

    afterEach(async()=>{
        await Subreddit.deleteMany({})
        await server.close()
    })

    describe("add a new comment to a post in subreddit and user collections",()=>{
        let user;
        let post;
        let token;
        let subreddit;
        let comment;
        beforeEach(async ()=>{
            user = {
                name:"user1",
                email : "user1@gmail.com",
                password:"123456789"
            }
            post = {
                content:"post content"
            }
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }
            comment = {
                content: "comment content"
            }
            user = new User(user);
            subreddit = new Subreddit(subreddit);
            subreddit.createdBy = user._id
            subreddit = await subreddit.save();
            user = await user.save();
            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await User.deleteMany({});
            await Subreddit.deleteMany({});
        })

        const addPost = ()=>{
            return request(server)
                .post('/api/post/'+subreddit._id)
                .set("x-auth-token",token)
                .send(post)
        }
        const exec = ()=>{
            return request(server)
                .post('/api/comment/'+subreddit._id+"/"+post._id)
                .set("x-auth-token",token)
                .send(comment)
        }
        test('should return 400 if the comment was empty', async()=>{
            let res = await addPost();
            post = res.body
            comment = {};
            res = await exec();

            expect(res.status).toBe(400);
        })
        test('should return 404 subreddit not found', async()=>{
            let res = await addPost();
            post = res.body
            await Subreddit.findByIdAndDelete(subreddit._id);
            res = await exec();

            expect(res.status).toBe(404);
        })
        test('should save comment to the user and subreddit collections', async()=>{
            let res = await addPost();
            post = res.body
            res = await exec();
            user =  await User.findById(user._id);
            subreddit =  await Subreddit.findById(subreddit._id);


            expect(res.status).toBe(200);
            expect(user.postsPublished[0].comments[0].content).toBe(comment.content);
            expect(subreddit.postsPublished[0].comments[0].content).toBe(comment.content);
        })
    })

    describe('get all comments on a post',()=>{
        let user;
        let post;
        let token;
        let subreddit;
        beforeEach(async ()=>{
            user = {
                name:"user1",
                email : "user1@gmail.com",
                password:"123456789"
            }
            post = {
                content:"post content"
            }
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }
            comment = {
                content: "comment content"
            }

            user = new User(user);
            subreddit = new Subreddit(subreddit);
            subreddit.createdBy = user._id
            subreddit = await subreddit.save();
            user = await user.save();
            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await User.deleteMany({});
            await Subreddit.deleteMany({});
        })

        const addPost = ()=>{
            return request(server)
                .post('/api/post/'+subreddit._id)
                .set("x-auth-token",token)
                .send(post)
        }
        const addComment = ()=>{
            return request(server)
                .post('/api/comment/'+subreddit._id+"/"+post._id)
                .set("x-auth-token",token)
                .send(comment)
        }
        const exec = ()=>{
            return request(server)
                .get('/api/comment/'+subreddit._id+"/"+post._id)
                .set("x-auth-token",token)
        }
        test('should return 404 if subreddit not found', async()=>{
            let res = await addPost();
            post = res.body
            await Subreddit.findByIdAndDelete(subreddit._id);
            res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return 404 if post not found', async()=>{
            post._id = new mongoose.mongo.ObjectId().toHexString();
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return comment for the post', async()=>{
            let res = await addPost();
            post = res.body
            await addComment();
            res = await exec();

            expect(res.status).toBe(200);
            expect(res.body[0].content).toBe(comment.content);
        })
    })

    describe('update a comments on a post',()=>{
        let user;
        let post;
        let token;
        let subreddit;
        let comment;
        let newComment;
        beforeEach(async ()=>{
            user = {
                name:"user1",
                email : "user1@gmail.com",
                password:"123456789"
            }
            post = {
                content:"post content"
            }
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }
            comment = {
                content: "comment content"
            }
            newComment = {
                content: "comment content updated"
            }

            user = new User(user);
            subreddit = new Subreddit(subreddit);
            subreddit.createdBy = user._id
            subreddit = await subreddit.save();
            user = await user.save();
            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await User.deleteMany({});
            await Subreddit.deleteMany({});
        })

        const addPost = ()=>{
            return request(server)
                .post('/api/post/'+subreddit._id)
                .set("x-auth-token",token)
                .send(post)
        }
        const addComment = ()=>{
            return request(server)
                .post('/api/comment/'+subreddit._id+"/"+post._id)
                .set("x-auth-token",token)
                .send(comment)
        }
        const exec = ()=>{
            return request(server)
                .put('/api/comment/'+subreddit._id+"/"+post._id+"/"+comment._id)
                .set("x-auth-token",token)
                .send(newComment)
        }
        test('should return 404 if subreddit not found', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            await Subreddit.findByIdAndDelete(subreddit._id);
            res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return 404 if post not found', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            post._id = new mongoose.mongo.ObjectId().toHexString();
            res = await exec();

            expect(res.status).toBe(404);
        })
        test("should return 401 if the user doesn't have permission to change the comment", async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            token = new User().generateAuthToken();
            res = await exec();

            expect(res.status).toBe(401);
        })
        test('should update the comment content', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            res = await exec();

            subreddit = await Subreddit.findById(subreddit._id);
            const commentInSubredditDb = subreddit.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            user = await User.findById(user._id);
            const commentInUserDb = user.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            expect(res.status).toBe(200);
            expect(commentInSubredditDb.content).toBe(newComment.content);
            expect(commentInUserDb.content).toBe(newComment.content);
        })
    })

    describe("remove comment from user and subreddit collections",()=>{
        let user;
        let post;
        let token;
        let subreddit;
        let comment;
        beforeEach(async ()=>{
            user = {
                name:"user1",
                email : "user1@gmail.com",
                password:"123456789"
            }
            post = {
                content:"post content"
            }
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }
            comment = {
                content: "comment content"
            }

            user = new User(user);
            subreddit = new Subreddit(subreddit);
            subreddit.createdBy = user._id
            subreddit = await subreddit.save();
            user = await user.save();
            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await User.deleteMany({});
            await Subreddit.deleteMany({});
        })

        const addPost = ()=>{
            return request(server)
                .post('/api/post/'+subreddit._id)
                .set("x-auth-token",token)
                .send(post)
        }
        const addComment = ()=>{
            return request(server)
                .post('/api/comment/'+subreddit._id+"/"+post._id)
                .set("x-auth-token",token)
                .send(comment)
        }
        const exec = ()=>{
            return request(server)
                .delete('/api/comment/'+subreddit._id+"/"+post._id+"/"+comment._id)
                .set("x-auth-token",token)
        }
        test('should return 404 if subreddit not found', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            await Subreddit.findByIdAndDelete(subreddit._id);
            res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return 404 if post not found', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            post._id = new mongoose.mongo.ObjectId().toHexString();
            res = await exec();

            expect(res.status).toBe(404);
        })
        test("should return 401 if the user doesn't have permission to change the comment", async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            token = new User().generateAuthToken();
            res = await exec();

            console.log(res.text)
            expect(res.status).toBe(401);
        })
        test('should remove post from the user and subreddit', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            res = await exec();

            user =  await User.findById(user._id);
            subreddit =  await Subreddit.findById(subreddit._id);


            const commentsInUserDb = user.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments

            const commentsInSubredditDb = subreddit.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments

            expect(res.status).toBe(200);
            expect(commentsInUserDb).toHaveLength(0);
            expect(commentsInSubredditDb).toHaveLength(0);
        })
    })

    describe('upvote a comment',()=>{
        let user;
        let post;
        let token;
        let subreddit;
        let comment;
        beforeEach(async ()=>{
            user = {
                name:"user1",
                email : "user1@gmail.com",
                password:"123456789"
            }
            post = {
                content:"post content"
            }
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }
            comment = {
                content: "comment content"
            }

            user = new User(user);
            subreddit = new Subreddit(subreddit);
            subreddit.createdBy = user._id
            subreddit = await subreddit.save();
            user = await user.save();
            token = user.generateAuthToken();

        })
        afterEach(async ()=>{
            await User.deleteMany({});
            await Subreddit.deleteMany({});
        })

        const addPost = ()=>{
            return request(server)
                .post('/api/post/'+subreddit._id)
                .set("x-auth-token",token)
                .send(post)
        }
        const addComment = ()=>{
            return request(server)
                .post('/api/comment/'+subreddit._id+"/"+post._id)
                .set("x-auth-token",token)
                .send(comment)
        }
        const downVote = ()=>{
            return request(server)
                .put('/api/comment/downvote/'+subreddit._id+"/"+post._id+"/"+comment._id)
                .set("x-auth-token",token)
        }
        const exec = ()=>{
            return request(server)
                .put('/api/comment/upvote/'+subreddit._id+"/"+post._id+"/"+comment._id)
                .set("x-auth-token",token)
        }
        test('should return 404 if subreddit not found', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            await Subreddit.findByIdAndDelete(subreddit._id);
            res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return 404 if post not found', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            post._id = new mongoose.mongo.ObjectId().toHexString();
            res = await exec();

            console.log(res.text)

            expect(res.status).toBe(404);
        })
        test('should return 404 if comment not found', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            comment._id = new mongoose.mongo.ObjectId().toHexString();
            res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return 400 if the user already upvoted the comment', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            await exec();
            res = await exec();

            console.log(res.text)
            expect(res.status).toBe(400);
        })
        test('should upvote the comment', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            res = await exec();

            subreddit = await Subreddit.findById(subreddit._id);
            const commentInSubredditDb = subreddit.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            user = await User.findById(user._id);
            const commentInUserDb = user.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            console.log(commentInSubredditDb)

            expect(res.status).toBe(200);
            expect(commentInSubredditDb.upVotes).toBe(1);
            expect(commentInUserDb.upVotes).toBe(1);
            expect(commentInUserDb.usersUpVoted[0]).toMatchObject(user._id)
        })
        test('should remove downvote and add upvote to the comment', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            res = await downVote();

            subreddit = await Subreddit.findById(subreddit._id);
            let commentInSubredditDb = subreddit.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            user = await User.findById(user._id);
            let commentInUserDb = user.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            expect(res.status).toBe(200);
            expect(commentInSubredditDb.downVotes).toBe(1);
            expect(commentInUserDb.downVotes).toBe(1);
            expect(commentInUserDb.usersDownVoted[0]).toMatchObject(user._id)

            res = await exec();

            subreddit = await Subreddit.findById(subreddit._id);
            commentInSubredditDb = subreddit.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            user = await User.findById(user._id);
            commentInUserDb = user.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            expect(res.status).toBe(200);
            expect(commentInSubredditDb.upVotes).toBe(1);
            expect(commentInUserDb.upVotes).toBe(1);
            expect(commentInUserDb.usersUpVoted[0]).toMatchObject(user._id)
        })
    })

    describe('downvote a comment',()=>{
        let user;
        let post;
        let token;
        let subreddit;
        let comment;
        beforeEach(async ()=>{
            user = {
                name:"user1",
                email : "user1@gmail.com",
                password:"123456789"
            }
            post = {
                content:"post content"
            }
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }
            comment = {
                content: "comment content"
            }

            user = new User(user);
            subreddit = new Subreddit(subreddit);
            subreddit.createdBy = user._id
            subreddit = await subreddit.save();
            user = await user.save();
            token = user.generateAuthToken();

        })
        afterEach(async ()=>{
            await User.deleteMany({});
            await Subreddit.deleteMany({});
        })

        const addPost = ()=>{
            return request(server)
                .post('/api/post/'+subreddit._id)
                .set("x-auth-token",token)
                .send(post)
        }
        const addComment = ()=>{
            return request(server)
                .post('/api/comment/'+subreddit._id+"/"+post._id)
                .set("x-auth-token",token)
                .send(comment)
        }
        const upVote = ()=>{
            return request(server)
                .put('/api/comment/upvote/'+subreddit._id+"/"+post._id+"/"+comment._id)
                .set("x-auth-token",token)
        }
        const exec = ()=>{
            return request(server)
                .put('/api/comment/downvote/'+subreddit._id+"/"+post._id+"/"+comment._id)
                .set("x-auth-token",token)
        }
        test('should return 404 if subreddit not found', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            await Subreddit.findByIdAndDelete(subreddit._id);
            res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return 404 if post not found', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            post._id = new mongoose.mongo.ObjectId().toHexString();
            res = await exec();

            console.log(res.text)

            expect(res.status).toBe(404);
        })
        test('should return 404 if comment not found', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            comment._id = new mongoose.mongo.ObjectId().toHexString();
            res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return 400 if the user already downvoted the comment', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            await exec();
            res = await exec();

            console.log(res.text)
            expect(res.status).toBe(400);
        })
        test('should downvote the comment', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            res = await exec();

            subreddit = await Subreddit.findById(subreddit._id);
            const commentInSubredditDb = subreddit.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            user = await User.findById(user._id);
            const commentInUserDb = user.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            console.log(commentInSubredditDb)

            expect(res.status).toBe(200);
            expect(commentInSubredditDb.downVotes).toBe(1);
            expect(commentInUserDb.downVotes).toBe(1);
            expect(commentInUserDb.usersDownVoted[0]).toMatchObject(user._id)
        })
        test('should remove upvote and add downvote to the comment', async()=>{
            let res = await addPost();
            post = res.body
            res = await addComment()
            comment = res.body
            res = await upVote();

            subreddit = await Subreddit.findById(subreddit._id);
            let commentInSubredditDb = subreddit.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            user = await User.findById(user._id);
            let commentInUserDb = user.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            expect(res.status).toBe(200);
            expect(commentInSubredditDb.upVotes).toBe(1);
            expect(commentInUserDb.upVotes).toBe(1);
            expect(commentInUserDb.usersUpVoted[0]).toMatchObject(user._id)

            res = await exec();

            subreddit = await Subreddit.findById(subreddit._id);
            commentInSubredditDb = subreddit.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            user = await User.findById(user._id);
            commentInUserDb = user.postsPublished
                .filter(p => p._id.toString() === post._id)[0]
                .comments.filter(c => c._id.toString() === comment._id.toString())[0]

            expect(res.status).toBe(200);
            expect(commentInSubredditDb.downVotes).toBe(1);
            expect(commentInUserDb.downVotes).toBe(1);
            expect(commentInUserDb.usersDownVoted[0]).toMatchObject(user._id)
        })
    })

})