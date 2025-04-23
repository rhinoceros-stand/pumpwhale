import * as dotenv from 'dotenv'
import Koa from 'koa'
import Router from '@koa/router'
import cors from '@koa/cors'
import bodyParser from '@koa/bodyparser'
import { getTokenListPrice } from '../services/okx/token'

dotenv.config({
  path: ['.env.local', 'env']
})

const router = new Router()
const app = new Koa()

router.get('/', (ctx, next) => {
  // ctx.router available
  ctx.body = 'Hello World'
})

router.post('/api/v1/callback', async (ctx, next) => {
})

router.post('/api/v1/price', async (ctx, next) => {
  const tokenList = ctx.request.body
  if (Array.isArray(tokenList)) {
    const response = await (
      await getTokenListPrice(tokenList)
    ).json()

    if (response.data) {
      ctx.body = response.data

      return
    }
  }

  ctx.body = {}
})

app
  .use(cors())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000)
