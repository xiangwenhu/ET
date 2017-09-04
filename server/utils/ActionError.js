var util = require('util')

var ActionError = function (msg, type, instruction) {
    Error.captureStackTrace(this)
    this.message = msg || 'Error'
    this.type = type
    this.instruction = instruction
}
util.inherits(ActionError, Error)
ActionError.prototype.name = 'Action Error'



module.exports = ActionError