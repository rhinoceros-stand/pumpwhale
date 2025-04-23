import { Connection, PublicKey } from '@solana/web3.js'
import { findLast } from 'lodash'
import { logger } from '../../utils/logger'

const RAYDIUM_V4 = '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1'

/**
 * 解析 Bonding 交易信息
 * @param signature
 * @param connection
 */
export async function decodeBondingTransaction(signature: string, connection: Connection) {
  try {
    const tx = await connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    })

    if (!tx) {
      return null
    }

    const tokenBalances = tx.meta?.postTokenBalances

    if (Array.isArray(tokenBalances)) {
      const selectedRecord = findLast(tokenBalances, record => {
        return record.owner === RAYDIUM_V4 && record.mint !== 'So11111111111111111111111111111111111111112'
      })

      if (!selectedRecord) {
        return
      }

      return new PublicKey(selectedRecord.mint)
    }
  } catch (e) {
    logger.error('Error decoding bonding transaction:', e)
  }
}
