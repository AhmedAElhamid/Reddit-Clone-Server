const {User} = require('../../../models/user');
const request = require('supertest');
const _ = require('lodash');


describe('user route',()=>{
    let server;

    beforeEach(()=>{
        server = require('../../../server');
    })

    afterEach(async()=>{
        await User.remove({})
        await server.close()
    })
    describe('register a new user',()=>{
        let user;
        beforeEach(()=>{
            user = {
                name:"name1",
                email:"name1@gmail.com",
                password:"123456789"
            }
        })

        const exec = ()=>{
            return request(server)
                .post('/api/user/register')
                .send(user)
        }
        test('should return 400 if request was empty',async ()=>{
            user = {};
            const res = await exec();
            expect(res.status).toBe(400);
        })
        test('should return 400 if user already registered',async ()=>{
            user = new User(user);
            user = await user.save();

            const res = await exec();
            expect(res.status).toBe(400);
        })
        test('should return 200 if user not registered',async ()=>{
            const res = await exec();
            const token = res.header["x-auth-token"];
            const userRegistered = res.body

            expect(res.status).toBe(200);
            expect(token).toBe(User(userRegistered).generateAuthToken());
            expect(_.pick(userRegistered,["email","name"]))
                .toMatchObject(_.pick(user,["email","name"]))
        })
    })
    describe('get current user',()=>{
        let user;
        let token;
        beforeEach(()=>{
            user = {
                name:"name1",
                email:"name1@gmail.com",
                password:"123456789"
            }
        })

        const exec = ()=>{
            return request(server)
                .get('/api/user/me')
                .set("x-auth-token",token)
                .send(user)
        }

        test('should return the user if logged in',async ()=>{
            let userInDb = new User(user);
            userInDb = await userInDb.save();

            token = User(userInDb).generateAuthToken();

            const res = await exec()
            expect(res.status).toBe(200);
            expect(_.pick(userInDb,["email","name"]))
                .toMatchObject(_.pick(user,["email","name"]))
        })
    })
})