import Koa from 'koa'
import Router from '@koa/router'
import cors from '@koa/cors'
import bodyParser from '@koa/bodyparser'

const router = new Router()
const app = new Koa()


router.get('/', (ctx, next) => {
  // ctx.router available
  ctx.body = 'Hello World'
})

router.post('/api/v1/callback', async (ctx, next) => {
})

app
  .use(cors())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000)
