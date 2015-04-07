/**
 * Module dependencies.
 */

var Hapi = require('hapi');
var path = require('path');

// This should refer to the local React and gets installed via `npm install` in
// the example.
var reactViews = require('../../');

// env defaults
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var server = new Hapi.Server();

// all environments

server.connection({
    port: process.env.PORT || 3000
});

var caching = (process.env.NODE_ENV === 'development') ? false : true;
var jsxOptions = {
    harmony: true,
    stripTypes: true,
    caching: caching
};

var engine = reactViews(jsxOptions);

server.views({
    defaultExtension: 'jsx',
    engines: {
        jsx: engine,
        js: engine
    },
    isCached: caching,
    path: path.join(__dirname, './views'),
    relativeTo: __dirname
});

server.route({
    method: 'GET',
    path: '/',
    handler: require('./routes/index').index
});
server.route({
    method: 'GET',
    path: '/users',
    handler: require('./routes/user').list
});

server.start(function () {
    console.log('Hapi server listening on port ' + server.info.port);
});