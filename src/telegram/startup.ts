import bot from './bot'
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
  const TX = '5KTBAriyUD2cnDzTpBua9PRD7tVRVYTmcWhu8M57QjqAQ2ELxS5BL13fcpjdy1tNtXyz2vo2RDSD9s9xGqgAPQue'
  const token = await decodeTransferTransaction(connection, TX)

  console.log(token)
})()
// bot.run()
