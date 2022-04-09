const path = require('path');
const Store = require('electron-store');

const schema = {
    screen: {
        type: 'object',
        properties: {
            x: { type: 'number', minimum: 0 },
            y: { type: 'number', minimum: 0 },
            w: { type: 'number', minimum: 0 },
            h: { type: 'number', minimum: 0 },
        },
    },
    output: {
        type: 'object',
        properties: {
            w: { type: 'number', minimum: 0 },
            h: { type: 'number', minimum: 0 },
        },
    },
};

const store = new Store({
    schema,
    cwd: path.join(__dirname, '..', 'config'),
});

module.exports = store;
