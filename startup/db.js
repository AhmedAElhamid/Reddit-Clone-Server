const logger = require('./logging')();
const mongoose = require('mongoose');
const config = require('config');

module.exports = function() {
    const db = config.get('db');
    mongoose.connect(db,
        { useNewUrlParser: true,useUnifiedTopology: true })
        .then(() => logger.info(`Connected to ${db}...`));
};