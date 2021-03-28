const {User} = require('../../../models/user')
const request = require('supertest');

describe('auth middleware', ()=>{
    beforeEach(()=>{
        server = require('../../../server');
    })
    afterEach(async ()=>{
        await User.remove({})
        await server.close()
    })
    let token;

    beforeEach(()=>{
        token = new User().generateAuthToken();
    })

    const exec = ()=>{
        return request(server)
            .get('/api/user/me')
            .set('x-auth-token',token)
            .send({name:"user1"})
    }
    test('it should return 401 if no token was provided',async ()=>{
        token=""

        const res = await exec();

        expect(res.status).toBe(401)

    })
})