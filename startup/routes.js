const express = require('express');
const bodyParser = require('body-parser');
const user = require('../routes/user');
const auth = require('../routes/auth');
const subreddit = require('../routes/subreddit');
const post = require('../routes/posts');
const comment = require('../routes/comment');
const error = require('../middleware/error');
const paginate = require('express-paginate');


module.exports = function(app) {
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(paginate.middleware(10, 50));
    app.use('/api/user',user);
    app.use('/api/auth',auth);
    app.use('/api/subreddit',subreddit);
    app.use('/api/post',post);
    app.use('/api/comment',comment);
    app.use(error);
}