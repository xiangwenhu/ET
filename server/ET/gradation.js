const stage = require('./stage')
function gradation(stages) {
    this.stages = stages
}
gradation.prototype.execute = async function (ctx, options) {
    return new Promise((resolve, reject) => {
        try {
            let result = this.stages.reduce((p, st) => {
                return p.then((val) => new stage(st).get(ctx, val))
            }, Promise.resolve({})).catch(err => { throw err })

            resolve(result)
        } catch (err) {
            return reject(err)
        }
    })
}
module.exports = gradation