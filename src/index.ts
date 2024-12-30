import * as dotenv from 'dotenv'
import { Connection } from '@solana/web3.js'
import Trading from './services/trading'

(async () => {
  dotenv.config({
    path: ['.env.local', 'env']
  })

  const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed')
  const trading = new Trading({ connection })
})()
