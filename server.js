const express = require('express');
const logger = require('./startup/logging')();
const app = express();
const config = require('config');

const port = process.env.PORT || config.get('port');

process.on('uncaughtException',(ex)=>{
    logger.info('we got an unhandled exception');
    logger.error(ex.message,ex);
});


require("./startup/routes")(app);
require("./startup/db")();
require("./startup/validation")();

const server = app.listen(port,() =>{ logger.info(`listening on port ${port}`);});

module.exports = server;
