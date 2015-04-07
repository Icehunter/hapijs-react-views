/*
 * GET home page.
 */

exports.index = function (request, reply) {
    reply.view('index', {
        title: 'Hapi',
        foo: {
            bar: 'baz'
        }
    });
};