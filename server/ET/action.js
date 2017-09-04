const fetch = require('node-fetch')

function action(type, script) {
    if (!(this instanceof action)) {
        return new action(type, script)
    }
    if (typeof type === 'object') {
        this.type = type.type
        this.script = type.instruction
        return
    }
    this.type = type
    this.script = script
}

action.prototype.get = function () {
    let fn
    switch (this.type) {
        case 'assign':
            fn = new Function(...arguments, this.script)
            break;
        case 'api':
            fn = context => {
                var opt = eval(`(${this.script})`)
                return fetch(opt.url, opt).then(res =>
                    res.headers.get('Content-Type') && res.headers.get('Content-Type').includes('application/json') ? res.json() : res.text()
                )
            }
            break;
        case 'assert':
            fn = (context, response) => {
                if (!eval(this.script)) {
                    throw new Error(`${this.script} 断言失败`)
                }
                return response
            }
            break;
        default:
            throw Error('无效的action')
    }
    fn.type = this.type
    return fn
}

// TODO:: 有效性验证 
action.prototype.validate = function () {
    return true
}

module.exports = action