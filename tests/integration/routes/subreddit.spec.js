const {Subreddit} = require('../../../models/subreddit');
const {User} = require('../../../models/user');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');


describe('subreddit route',()=>{
    let server;
    let token;

    beforeEach(()=>{
        server = require('../../../server');
    })

    afterEach(async()=>{
        await Subreddit.deleteMany({})
        await server.close()
    })
    describe("get all subreddits",()=>{
        token = new User().generateAuthToken();
        let subrreddits = [
            {
                name:"subreddit1",
                bio : "new subreddit 1 bio"
            },
            {
                name:"subreddit2",
                bio : "new subreddit 2 bio"
            }
        ]

        test("should return the documents in the db",async ()=>{
            subrreddits.map(async (s) =>{
                const subreddit = new Subreddit(s);
                try{
                subreddit.createdBy = jwt
                    .verify(token,config.get('jwtPrivateKey'))
                    ._id;
                }catch(ex){
                    console.log(ex.message);
                }
                await subreddit.save();
            })

            const res = await request(server)
                .get('/api/subreddit/')
                .set("x-auth-token",token)

            expect(res.status).toBe(200)

        })
    })

    describe("get single subreddit",()=>{
        let subreddit;
        let token;

        beforeEach(async ()=>{
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }
            const user = new User();
            subreddit = new Subreddit(subreddit);
            subreddit.createdBy = user._id
            subreddit = await subreddit.save();
            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await Subreddit.deleteMany({});
        })

        const exec = ()=>{
            return request(server)
                .get('/api/subreddit/'+subreddit._id)
                .set("x-auth-token",token)
        }

        test("should return 404 if subreddit is not found",async ()=>{
            await Subreddit.deleteOne({_id:subreddit._id})
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test("should return the subreddit",async ()=>{
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(subreddit.name);
        })
    })

    describe("add a new subreddit",()=>{
        let subreddit;
        let token;

        beforeEach(()=>{
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }
        })
        afterEach(()=>{
            token = '';
        })

        const exec = ()=>{
            return request(server)
                .post('/api/subreddit/')
                .set("x-auth-token",token)
                .send(subreddit)
        }


        test("should return 401 if user not logged in",async ()=>{
            subreddit ={};
            token = '';
            const res = await exec();

            expect(res.status).toBe(401);
        })

        test("should return 400 if subreddit was empty",async ()=>{
            subreddit ={};
            token = new User().generateAuthToken();
            const res = await exec();

            expect(res.status).toBe(400);
        })

        test("should return 200 if subreddit was sent",async ()=>{
            token = new User().generateAuthToken();
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject(subreddit);
        })

    })

    describe("update an existing subreddit",()=>{
        let subreddit;
        let subredditUpdated;
        let token;

        beforeEach(async ()=>{
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }
            subredditUpdated = {
                name:"subreddit1 updated",
                bio : "new subreddit bio updated"
            }
            const user = new User();
            subreddit = new Subreddit(subreddit);
            subreddit.createdBy = user._id
            subreddit = await subreddit.save();
            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await Subreddit.deleteMany({});
        })

        const exec = ()=>{
            return request(server)
                .put('/api/subreddit/'+subreddit._id)
                .set("x-auth-token",token)
                .send(subredditUpdated)
        }


        test("should return 400 if subreddit was empty",async ()=>{
            subredditUpdated ={};
            const res = await exec();

            expect(res.status).toBe(400);
        })

        test("should return 404 if subreddit is not found",async ()=>{
            await Subreddit.deleteOne({_id:subreddit._id})
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test("should return 401 if user doesn't have permission to update the subreddit",async ()=>{
            token = new User().generateAuthToken();
            const res = await exec();

            expect(res.status).toBe(401);
        })
        test("should return 200 if subreddit was updated",async ()=>{
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject(subredditUpdated);
        })
    })

    describe("subscribe to subreddit",()=>{
        let subreddit;
        let token;
        beforeEach(async ()=>{
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }

            const user = new User();
            subreddit = new Subreddit(subreddit);
            subreddit.createdBy = user._id
            subreddit = await subreddit.save();
            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await Subreddit.deleteMany({});
        })

        const exec = ()=>{
            return request(server)
                .put('/api/subreddit/subscribe/'+subreddit._id)
                .set("x-auth-token",token)
        }

        test("should return 404 if subreddit is not found",async ()=>{
            await Subreddit.deleteOne({_id:subreddit._id})
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test("should return 400 if user already subscribed",async ()=>{
            await exec();

            const res = await exec();
            expect(res.status).toBe(400);
        })
        test("should return subreddit with the new subscription",async ()=>{
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.subscriptions).toBe(subreddit.subscriptions+1);
        })
    })

    describe("unsubscribe to subreddit",()=>{
        let subreddit;
        let token;
        beforeEach(async ()=>{
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }

            const user = new User();
            subreddit = new Subreddit(subreddit);
            subreddit.createdBy = user._id
            subreddit = await subreddit.save();
            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await Subreddit.deleteMany({});
        })

        const subscribe = ()=>{
            return request(server)
                .put('/api/subreddit/subscribe/'+subreddit._id)
                .set("x-auth-token",token)
        }
        const exec = ()=>{
            return request(server)
                .put('/api/subreddit/unsubscribe/'+subreddit._id)
                .set("x-auth-token",token)
        }

        test("should return 404 if subreddit is not found",async ()=>{
            await Subreddit.deleteOne({_id:subreddit._id})
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test("should return 400 if user is not subscribed",async ()=>{
            await exec();

            const res = await exec();
            expect(res.status).toBe(400);
        })
        test("should unsubscribe to the subreddit",async ()=>{
            let res = await subscribe();
            expect(res.status).toBe(200);
            expect(res.body.subscriptions).toBe(subreddit.subscriptions+1);

            res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.subscriptions).toBe(subreddit.subscriptions);
        })
    })

    describe("delete subreddit",()=>{
        let subreddit;
        let token;

        beforeEach(async ()=>{
            subreddit = {
                name:"subreddit1",
                bio : "new subreddit bio"
            }
            const user = new User();
            subreddit = new Subreddit(subreddit);
            subreddit.createdBy = user._id
            subreddit = await subreddit.save();
            token = user.generateAuthToken();
        })
        afterEach(async ()=>{
            await Subreddit.deleteMany({});
        })

        const exec = ()=>{
            return request(server)
                .delete('/api/subreddit/'+subreddit._id)
                .set("x-auth-token",token)
        }

        test("should return 404 if subreddit is not found",async ()=>{
            await Subreddit.deleteOne({_id:subreddit._id})
            const res = await exec();

            expect(res.status).toBe(404);
        })
        test("should return 401 if user doesn't have permission to delete the subreddit",async ()=>{
            token = new User().generateAuthToken();
            const res = await exec();

            expect(res.status).toBe(401);
        })
        test("should return 200 if subreddit was deleted",async ()=>{
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(subreddit.name);
        })
    })
})