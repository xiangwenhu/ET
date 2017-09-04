const Router = require('koa-router'),
    fetch = require('node-fetch'),
    gradation = require('../ET/gradation'),
    only = require('only'),
    router = Router({
        prefix: '/et'
    })
const defaultAssert = {
    "code": 10000
}

router.post('/', async ctx => {
    let { body } = ctx.request,
        { steps } = body
    ctx._data = {}
    ctx._options = { headers: {} }
    steps = steps.filter(step => {
        if (step.length === 3) {
            return true
        }
        // 长度不是3，必须有api action
        return step.filter(action => action.type === 'api').length === 1
    })  
    try {
        let result = await new gradation(steps).execute(ctx)
        ctx.body = result
    } catch (err) {
        ctx.body =  only(err,'message stack type instruction')
    }
})

module.exports = router