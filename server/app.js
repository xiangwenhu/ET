const Koa = require('koa'),
    static = require('koa-static'),
    http = require('http'),
    path = require('path'),
    koaBody = require('koa-body')
    register = require('./routes')


const app = new Koa()


app.use(static(path.resolve(__dirname + '/../client')))
app.use(koaBody())


register(app)

http.createServer(app.callback()).listen(3000)



