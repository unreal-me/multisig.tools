const http = require('http')
const socket_io = require('socket.io')

function socketInit(app) {
    const server = http.createServer(app.callback());
    io = socket_io(server);
    io.on('connection', function (socket) {
        console.log('a user connected');

        socket.on('join', data => {
            // console.log(data)
            // TODO: need auth???
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

async function sendMessageByHash(hash, record) {
    io.to(hash).emit('message', record);
}

module.exports = {
    socketInit,
    sendMessageByHash
}