import { Connection } from '@solana/web3.js'
import PumpFun from '../services/pumpfun'
import telegram from '../services/telegram'

let connection: Connection

try {
  connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed')
  console.info('Solana RPC Connection Success, Monitoring Pumpfun Bonding Address!')
} catch (err) {
  console.error('Solana RPC Connection Error', err)
}

new PumpFun({
  connection
}).start()

