const {Subreddit} = require('../../../models/subreddit');
const {User} = require('../../../models/user');
const request = require('supertest');
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken');
const config = require('config');


describe('posts route',()=>{
    let server;

    beforeEach(()=>{
        server = require('../../../server');
    })

    afterEach(async()=>{
        await Subreddit.deleteMany({})
        await server.close()
    })

    describe('get all posts for a user',()=>{
        let user;
        let post;
        let token;
        let subreddit
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

            subreddit = new Subreddit(subreddit);
            user = new User(user);
            post.publisher = user._id;
            post.publishedTo = subreddit._id

            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await User.deleteMany({});
            await Subreddit.deleteMany({});
        })

        const exec = ()=>{
            return request(server)
                .get('/api/post/user/')
                .set("x-auth-token",token)
        }
        test('should return 404 if no posts found for current user', async()=>{
            await user.save();
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return posts for current user', async()=>{
            user.postsPublished.push(post)
            user = await user.save();
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.data[0].content).toBe(post.content);
        })
    })

    describe('get all posts from a subreddit',()=>{
        let user;
        let post;
        let token;
        let subreddit
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

            subreddit = new Subreddit(subreddit);
            user = new User(user);
            post.publisher = user._id;
            post.publishedTo = subreddit._id
            subreddit.createdBy = user._id;
            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await User.deleteMany({});
            await Subreddit.deleteMany({});
        })

        const exec = ()=>{
            return request(server)
                .get('/api/post/subreddit/'+subreddit._id)
                .set("x-auth-token",token)
        }
        test('should return 404 if no posts found in the subreddit', async()=>{
            await subreddit.save();
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return posts for in the subreddit', async()=>{
            subreddit.postsPublished.push(post)
            await subreddit.save();
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.data[0].content).toBe(post.content);
        })
    })

    describe('get post by id from a user',()=>{
        let user;
        let post;
        let token;
        let subreddit
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

            subreddit = new Subreddit(subreddit);
            user = new User(user);
            post.publisher = user._id;
            post.publishedTo = subreddit._id
            user.postsPublished.push(post)
            user = await user.save();
            post = user.postsPublished[0]
            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await User.deleteMany({});
            await Subreddit.deleteMany({});
        })

        const exec = ()=>{
            return request(server)
                .get('/api/post/user/'+post._id)
                .set("x-auth-token",token)
        }
        test('should return 404 if post not found for current user', async()=>{
            post._id = mongoose.mongo.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return the post specified', async()=>{
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.content).toBe(post.content);
        })
    })

    describe('get a post given by id from a subreddit',()=>{
        let user;
        let post;
        let token;
        let subreddit
        beforeEach(async ()=>{
            user = {
                name:"user1",
                email : "user1@gmail.com",
                password:"123456789"
            }
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }

            subreddit = new Subreddit(subreddit);
            user = new User(user);
            post = {
                "publisher":user._id,
                "publishedTo":subreddit._id,
                "content":"post content"
            }
            subreddit.postsPublished.push(post)
            subreddit.createdBy = user._id
            subreddit = await subreddit.save();
            post = subreddit.postsPublished[0]
            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await User.deleteMany({});
            await Subreddit.deleteMany({});
        })

        const exec = ()=>{
            return request(server)
                .get('/api/post/subreddit/'+subreddit._id+"/"+post._id)
                .set("x-auth-token",token)
        }
        test('should return 404 if post not found', async()=>{
            post._id = mongoose.mongo.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return 404 if subreddit not found', async()=>{
            subreddit._id = mongoose.mongo.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test('should return the post specified', async()=>{
            const res = await exec();

            console.log(res.text);

            expect(res.status).toBe(200);
            expect(res.body.content).toBe(post.content);
        })
    })

    describe("add a new post to a user and a subreddit",()=>{
        let user;
        let post;
        let token;
        let subreddit
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

        const exec = ()=>{
            return request(server)
                .post('/api/post/'+subreddit._id)
                .set("x-auth-token",token)
                .send(post)
        }
        test('should return 400 if the post sent was empty', async()=>{
            post = {};
            const res = await exec();

            expect(res.status).toBe(400);
        })
        test('should return 404 subreddit not found', async()=>{
            await Subreddit.findByIdAndDelete(subreddit._id);
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test('should save post to the user and subreddit', async()=>{
            const res = await exec();
            user =  await User.findById(user._id);
            subreddit =  await Subreddit.findById(subreddit._id);


            expect(res.status).toBe(200);
            expect(user.postsPublished[0].content).toBe(post.content);
            expect(subreddit.postsPublished[0].content).toBe(post.content);
        })
    })

    describe("update post in user and subreddit collections",()=>{
        let user;
        let post;
        let token;
        let subreddit
        let newPost
        beforeEach(async ()=>{
            user = {
                name:"user1",
                email : "user1@gmail.com",
                password:"123456789"
            }
            post = {
                content:"post content"
            }
            newPost = {
                content:"post content updated"
            }
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
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
                .put('/api/post/'+post._id)
                .set("x-auth-token",token)
                .send(newPost)
        }
        test('should return 400 if the post sent was empty', async()=>{
            let res = await addPost();
            post = res.body
            newPost = {};
            res = await exec();

            console.log(res.text);
            expect(res.status).toBe(400);
        })
        test('should return 404 if post not found', async()=>{
            post_id = new mongoose.mongo.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test('should save post to the user and subreddit', async()=>{
            let res = await addPost();
            post = res.body

            res = await exec();
            user =  await User.findById(user._id);
            subreddit =  await Subreddit.findById(subreddit._id);

            expect(res.status).toBe(200);
            expect(user.postsPublished[0].content).toBe(newPost.content);
            expect(subreddit.postsPublished[0].content).toBe(newPost.content);
        })
    })

    describe("remove post from user and subreddit collections",()=>{
        let user;
        let post;
        let token;
        let subreddit
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
                .delete('/api/post/'+post._id)
                .set("x-auth-token",token)
        }
        test('should return 404 if post not found', async()=>{
            post._id = new mongoose.mongo.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test('should remove post from the user and subreddit', async()=>{
            let res = await addPost();
            post = res.body

            res = await exec();
            user =  await User.findById(user._id);
            subreddit =  await Subreddit.findById(subreddit._id);

            console.log(res.text)

            expect(res.status).toBe(200);
            expect(user.postsPublished[0]).toBeUndefined();
            expect(subreddit.postsPublished[0]).toBeUndefined();
        })
    })

    describe("upvote a post",()=>{
        let user;
        let post;
        let token;
        let subreddit
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
        const downVote = ()=>{
            return request(server)
                .post('/api/post/downvote/'+subreddit._id+"/"+post._id)
                .set("x-auth-token",token)
        }
        const exec = ()=>{
            return request(server)
                .post('/api/post/upvote/'+subreddit._id+"/"+post._id)
                .set("x-auth-token",token)
        }
        test('should return 404 if post not found', async()=>{
            post._id = new mongoose.mongo.ObjectId();
            const res = await exec();

            console.log(res.text)
            expect(res.status).toBe(404);
        })
        test('should return 404 if subreddit not found', async()=>{
            let res = await addPost();
            post = res.body
            subreddit._id = new mongoose.mongo.ObjectId();
            res = await exec();

            console.log(res.text)
            expect(res.status).toBe(404);
        })
        test('should increment upvote and add the user to the usersUpVoted', async()=>{
            let res = await addPost();
            post = res.body

            res = await exec();
            console.log(res.text)
            const postInDb = await Subreddit.find({_id:subreddit._id,
                postsPublished:{ $elemMatch :{_id:post._id}}})

            expect(res.status).toBe(200);
            expect(postInDb[0].postsPublished[0].upVotes).toBe(1);
            expect(postInDb[0].postsPublished[0].usersUpVoted[0]).toMatchObject(user._id);
            expect(postInDb[0].postsPublished[0].downVotes).toBe(0);
            expect(postInDb[0].postsPublished[0].usersDownVoted).toHaveLength(0);
        })
        test('should remove downvote and remove user from usersDownVoted and add upvote and add the user to the usersUpVoted', async()=>{
            let res = await addPost();
            post = res.body

            res = await downVote();

            let postInDb = await Subreddit.find({_id:subreddit._id,
                postsPublished:{ $elemMatch :{_id:post._id}}})

            expect(res.status).toBe(200);
            expect(postInDb[0].postsPublished[0].downVotes).toBe(1);
            expect(postInDb[0].postsPublished[0].usersDownVoted[0]).toMatchObject(user._id);

            res = await exec();

            postInDb = await Subreddit.find({_id:subreddit._id,
                postsPublished:{ $elemMatch :{_id:post._id}}})


            expect(res.status).toBe(200);
            expect(postInDb[0].postsPublished[0].downVotes).toBe(0);
            expect(postInDb[0].postsPublished[0].usersDownVoted).toHaveLength(0);
            expect(postInDb[0].postsPublished[0].upVotes).toBe(1);
            expect(postInDb[0].postsPublished[0].usersUpVoted[0]).toMatchObject(user._id);
        })

    })

    describe("downvote a post",()=>{
        let user;
        let post;
        let token;
        let subreddit
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
                .post('/api/post/downvote/'+subreddit._id+"/"+post._id)
                .set("x-auth-token",token)
        }
        const upVote = ()=>{
            return request(server)
                .post('/api/post/upvote/'+subreddit._id+"/"+post._id)
                .set("x-auth-token",token)
        }
        test('should return 404 if post not found', async()=>{
            post._id = new mongoose.mongo.ObjectId();
            const res = await exec();

            console.log(res.text)
            expect(res.status).toBe(404);
        })
        test('should return 404 if subreddit not found', async()=>{
            let res = await addPost();
            post = res.body
            subreddit._id = new mongoose.mongo.ObjectId();
            res = await exec();

            console.log(res.text)
            expect(res.status).toBe(404);
        })
        test('should decrement upvote and add the user to the usersDownVoted', async()=>{
            let res = await addPost();
            post = res.body

            res = await exec();
            const postInDb = await Subreddit.find({_id:subreddit._id,
                postsPublished:{ $elemMatch :{_id:post._id}}})

            expect(res.status).toBe(200);
            expect(postInDb[0].postsPublished[0].downVotes).toBe(1);
            expect(postInDb[0].postsPublished[0].usersDownVoted[0]).toMatchObject(user._id);
            expect(postInDb[0].postsPublished[0].upVotes).toBe(0);
            expect(postInDb[0].postsPublished[0].usersUpVoted).toHaveLength(0);
        })
        test('should remove upwnvote and remove user from usersUpVoted and add downvote and add the user to the usersDownVoted', async()=>{
            let res = await addPost();
            post = res.body

            res = await upVote();

            let postInDb = await Subreddit.find({_id:subreddit._id,
                postsPublished:{ $elemMatch :{_id:post._id}}})

            expect(res.status).toBe(200);
            expect(postInDb[0].postsPublished[0].upVotes).toBe(1);
            expect(postInDb[0].postsPublished[0].usersUpVoted[0]).toMatchObject(user._id);

            res = await exec();

            postInDb = await Subreddit.find({_id:subreddit._id,
                postsPublished:{ $elemMatch :{_id:post._id}}})


            expect(res.status).toBe(200);
            expect(postInDb[0].postsPublished[0].upVotes).toBe(0);
            expect(postInDb[0].postsPublished[0].usersUpVoted).toHaveLength(0);
            expect(postInDb[0].postsPublished[0].downVotes).toBe(1);
            expect(postInDb[0].postsPublished[0].usersDownVoted[0]).toMatchObject(user._id);
        })

    })
})