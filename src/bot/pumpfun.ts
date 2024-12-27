import { Connection, PublicKey } from '@solana/web3.js'
import { decodeTransferTransaction } from '../metadata'
import telegram from './telegram'

const PUMP_FUN_ADDRESS = new PublicKey('TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM')
const PUMP_FUN_LIQUIDITY_ADDRESS = new PublicKey('39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg')

let connection: Connection

const init = () => {
  try {
    connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed')
    console.info('Solana RPC Connection Success, Monitoring Pumpfun Mint Address!')
  } catch (err) {
    console.error('Solana RPC Connection Error', err)
  }

  telegram.run()
}

const run = () => {
  init()

  connection.onLogs(PUMP_FUN_ADDRESS, (accountInfo, context) => {
    const {
      signature,
      logs
    } = accountInfo

    // decodeTranscation(connection, signature).then((token)=>{
    //   addToList(NAME_SPACE, JSON.stringify(token))
    //   publishMessageToChannel(MessageType.TRADING, JSON.stringify(token))
    // })
    const event = logs[5]

    if (event.indexOf('Create') > -1) {
      // addToList(MessageType.NEW_POOL_CREATED, signature)
      // console.log('Fecthcing Token Create Event', signature, context.slot)
    }
  })

  connection.onLogs(PUMP_FUN_LIQUIDITY_ADDRESS, (accountInfo, context) => {
    const {
      signature,
      logs
    } = accountInfo

    if (!Array.isArray(logs)) {
      return
    }

    if (logs.length < 10) {
      return
    }

    const event = logs[7]
    if (event.indexOf('initialize2') > -1) {
      console.log('Pump.fun Liquidity merge Event', signature, context.slot)
      decodeTransferTransaction(connection, signature).then((token) => {
        telegram.sendMessage(token)
      })
    } else {
      console.log('Not initialize2 tx', signature)
    }
  })
}

export default {
  run
}
