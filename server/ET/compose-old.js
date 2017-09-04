const fetch = require('node-fetch'),
    { isJSON } = require('../utils')



function sequenceTasks(tasks) {
    function recordValue(results, value) {
        results.push(value);
        return results;
    }
    var pushValue = recordValue.bind(null, []);
    return tasks.reduce(function (promise, task) {
        return promise.then(task).then(pushValue);
    }, Promise.resolve());
}


const stepPomise = (step) => {
    let p = Promise.resolve()
    return function (context, data = {}) {
        return new Promise((resolve, reject) => {
            step.forEach(action => {
                switch (action.type) {
                    case 'assign':
                        context && data && eval(action.data)
                        break;
                    case 'api':
                        let option = eval('a =' + action.data)
                        return p = fetch(option.url, option).then(res =>
                            res.headers.get('Content-Type') && res.headers.get('Content-Type').includes('application/json') ? res.json() : res.text()
                        )
                        break;
                    case 'assert':
                        return p.then(response => {
                            if (eval(action.data)) {
                                return resolve(response)
                            }
                            throw new Error('assert 断言失败')
                        })
                        break;
                    default:
                        throw Error('无效的action')
                }
            })
        })
    }
}

module.exports = (steps = []) => {
    return function (context) {
        let data = {}
        return new Promise((resolve, reject) => {
            let arr = []
            steps.map(step => {
                return stepPomise(step)
            }).reduce(async (pre, cur) => {
                data = await pre(context, data)
                data = await cur(context, data)
            })
            resolve(data)
        }).catch(err => reject(err))
    }
}

