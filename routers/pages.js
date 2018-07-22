const Router = require('koa-router')
const router = new Router()
const controller = require('../controllers/pages')

router.get('/', controller.list)
router.get('/create', controller.create)
router.get('/detail/:hash', controller.detail)

module.exports = router.routes()
