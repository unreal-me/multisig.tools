const http = require('http')
const socket_io = require('socket.io')
// const socket = require('socket.io')
function socketInit(app) {
    const server = http.createServer(app.callback());
    io = socket_io(server);
    io.on('connection', function (socket) {
        console.log('a user connected');

        socket.on('join', data => {
            console.log(data)
            socket.join(data, function () {
                console.log(socket.rooms);
            });

        })
        socket.on('disconnect', function () {
            console.log('user disconnected');
        });
    });

    return server;
}

async function sendMessageByHash(hash) {
    io.to(hash).emit('message', hash);
}

module.exports = {
    socketInit,
    sendMessageByHash
}