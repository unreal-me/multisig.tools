const socket = require('../utils/socket')
async function hello(ctx) {
    let hash = ctx.params.hash
    // await socket.joinRoom(34)
    await ctx.render('index', {
        title: hash,
    })
}

async function hey(ctx) {
    let hash = ctx.params.hash
    await socket.sendMessageByHash(hash)
    ctx.body = "hey"
}

module.exports = {
    hello,
    hey
}
