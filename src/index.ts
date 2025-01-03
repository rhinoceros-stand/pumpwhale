import * as dotenv from 'dotenv'
import { getSupportChains } from './services/okx/common'

(async () => {
  dotenv.config({
    path: ['.env.local', 'env']
  })

  const response = await (
    await getSupportChains()
  ).json()

  console.log(response)
})()
