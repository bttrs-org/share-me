const path = require('path');
const { app } = require('electron');
const Store = require('electron-store');

const schema = {
    source: {
        type: 'string',
    },
    layout: {
        type: 'string',
    },
};

const store = new Store({
    schema,
    cwd: path.join(app.getAppPath(), 'config'),
});

module.exports = store;
