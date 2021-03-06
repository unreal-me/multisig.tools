const Koa = require('koa')
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router')
const views = require('koa-views')
const Logger = require('koa-logger')
const socketInit = require('./utils/socket').socketInit


const path = require('path')
const mongoose = require('mongoose')

const app = new Koa()
const router = new Router()

const server = socketInit(app);


// app.use((ctx, next) => {
//     return next().catch(err => {
//         ctx.status = err.status || 500
//         ctx.body = err
//     })
// })

if (process.env.NODE_ENV === 'development') {
    app.use(Logger())
}


app.use(views(path.join(__dirname, 'views'), {
    extension: 'ejs'
}))

app.use(bodyParser({
    enableTypes: ['json'],
    jsonLimit: '2mb',
    strict: true,
    onerror: function (err, ctx) {
        ctx.throw(422, "body parse error")
    }
}))

require('./routers')(router)
app.use(router.routes())
app.use(router.allowedMethods())

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true })

module.exports = server

