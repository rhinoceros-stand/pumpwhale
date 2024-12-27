import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'
import { addToList } from '../storage'
import { decodeTransferTransaction } from '../metadata'
import { MessageType } from '../message'

const PUMP_FUN_ADDRESS = new PublicKey('TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM')
const PUMP_FUN_LIQUIDITY_ADDRESS = new PublicKey('39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg')

let connection: Connection

const init = () => {
  try {
    connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed')
    console.info('Solana RPC Connection Success, Monitoring Pumpfun Mint Address!')
  } catch (err) {
    console.error('Solana RPC Connection Error', err)
  }
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
      addToList(MessageType.NEW_POOL_CREATED, signature)
      console.log('Fecthcing Token Create Event', signature, context.slot)
    }
  })


  connection.onLogs(PUMP_FUN_LIQUIDITY_ADDRESS, (accountInfo, context) => {
    const {
      signature,
      logs
    } = accountInfo

    // decodeTranscation(connection, signature).then((token)=>{
    //   addToList(NAME_SPACE, JSON.stringify(token))
    //   publishMessageToChannel(MessageType.TRADING, JSON.stringify(token))
    // })

    // Save logs to file named after signature
    const fs = require('fs');
    const path = require('path');
    
    try {
      const logData = {
        signature,
        logs,
        slot: context.slot,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(__dirname, '..', '..', 'logs', `${signature}.json`),
        JSON.stringify(logData, null, 2)
      );
    } catch (err) {
      console.error('Error saving log file:', err);
    }
    const event = logs[7]
    if (event.indexOf('initialize2') > -1) {
      console.log('Pumpfun Liquidity Fill Event', signature, context.slot)
    }
  })
}

export default {
  run
}
