const action = require('./action'),
    compose = require('koa-compose'),
    ActionError = require('../utils/ActionError')


function stage(actions) {
    this.actions = actions
    this.validate()
}

stage.prototype.validate = function () {
    if (!(this.actions instanceof Array)) {
        throw new Error('actions 必须是数组')
    }
    // 去除type或者instruction为空的
    this.actions = this.actions.filter(a => a.type && a.instruction)
    // TODO:: type 和 instruction 有效性检查
}

stage.prototype.get = function (context, data) {
    // 构建action
    return new Promise((resolve, reject) => {
        let res, fn
        compose(this.actions.map((act, index) =>
            async (context, next) => {
                try {
                    fn = action(act).get('context', 'response')
                    res = await fn(context, res || data)
                    index === this.actions.length - 1 ? resolve(res) : next()
                } catch (err) {
                    let actionError = new ActionError(err.message, act.type, act.instruction)
                    actionError.stack = err.stack
                    return reject(actionError)
                }
            }
        ))(context)
    })
}


module.exports = stage