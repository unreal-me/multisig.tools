module.exports = (router) => {
    router.use('/api', require('./records')),
    router.use('', require('./pages'))
}
