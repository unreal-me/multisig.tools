const Router = require('koa-router')
const router = new Router()
const Ctrl = require('../controllers/records')

router.get('/:hash', Ctrl.hello)
router.get('/hey/:hash', Ctrl.hey)

module.exports = router.routes()
