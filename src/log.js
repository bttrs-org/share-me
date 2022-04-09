const log = require('loglevel');
const prefix = require('loglevel-plugin-prefix');
const isDev = process.env.NODE_ENV === 'development';

log.setDefaultLevel(isDev ? 'debug' : 'error');
prefix.reg(log);
prefix.apply(log, {
    template: '%l (%n) [%t]:',
});

function createLog(prefix) {
    return log.getLogger(prefix);
}

module.exports = createLog;
