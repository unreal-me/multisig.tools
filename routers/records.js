const Router = require('koa-router')
const router = new Router()
const controller = require('../controllers/records')

router.get('/list', controller.list)
router.post('/create', controller.create)
router.post('/sign', controller.sign)
router.get('/detail/:hash', controller.detail)

module.exports = router.routes()
