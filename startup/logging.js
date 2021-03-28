const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;
// require('winston-mongodb');
require('express-async-errors');


module.exports = function() {

    const logger = createLogger({
        level: 'info',
        format: format.json(),
        defaultMeta: { service: 'user-service' },
        transports: [

            new transports.File({ filename: 'logs/error.log' ,level: 'error' }),
            new transports.File({ filename: 'logs/combined.log' }),
            new transports.Console({
                format: combine(
                    timestamp(),
                    prettyPrint()
                )
            })
        ],
        exceptionHandlers: [
            new transports.File({ filename: 'logs/exceptions.log' }),
            new transports.Console({
                format: combine(
                    label({ label: 'right meow!' }),
                    timestamp(),
                    prettyPrint()
                )
            })
        ]
    });

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
//     if (process.env.NODE_ENV !== 'production') {
//         logger.add(new winston.transports.Console({
//             format: format.simple(),
//         }));
//     }

    process.on('unhandledRejection', (ex) => {
        throw ex;
    });

    return logger;

}