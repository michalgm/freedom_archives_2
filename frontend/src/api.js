const feathers = require('@feathersjs/feathers');
const rest = require('@feathersjs/rest-client');
const auth = require('@feathersjs/authentication-client');

export const app = feathers();

const restClient = rest();

app.configure(restClient.fetch(window.fetch));
app.configure(auth({ path: '/api/authentication' }))

export const records = app.service('/api/records');
export const relationships = app.service('/api/relationships');
export const authentication = app.service('/api/authentication');
export const list_items = app.service('/api/list_items');

export const authenticate = async (username, password) => {
    return app.authenticate({
        strategy: 'local',
        username,
        password
    })
        .catch(e => {
            // Show login page (potentially with `e.message`)
            console.error('Authentication error', e);
            return Promise.reject(e);
        });
}

export const reAuth = app.reAuthenticate;

export const getAuthentication = app.get('/api/authentication');
