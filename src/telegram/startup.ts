import { decodeTransferTransaction } from '../metadata'
import { Connection } from '@solana/web3.js'


let connection: Connection

const init = () => {
  try {
    connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed')
    console.info('Solana RPC Connection Success, Monitoring Pumpfun Mint Address!')
  } catch (err) {
    console.error('Solana RPC Connection Error', err)
  }
}

(async () => {
  init()
  const TX = '5g2hu7wJu4qqzCbKtrhzwXXKLKtCcCQZ7wXbNZg8eSk8EsHDtChnCsjG4M7nS8216uUpkQ9PfqwoqW4WXQWaAwvF'
  const token = await decodeTransferTransaction(connection, TX)

  console.log(token)
})()
// bot.run()
