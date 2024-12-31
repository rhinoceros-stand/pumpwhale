import { Metaplex } from '@metaplex-foundation/js'
import { getMint } from '@solana/spl-token'
import { Connection, PublicKey } from '@solana/web3.js'
import { findLast, get, pick } from 'lodash'

const RAYDIUM_V4 = '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1'

/**
 * 解析转账交易
 * @param connection
 * @param signature
 * @returns
 */
export const decodeTransferTransaction = async (connection: Connection, signature: string) => {
  try {
    const tx = await connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    })

    if (!tx) {
      return null
    }

    let mintAddress = ''

    const tokenBalances = tx.meta?.postTokenBalances

    if (Array.isArray(tokenBalances)) {
      const selectedRecord = findLast(tokenBalances, record => {
        return record.owner === RAYDIUM_V4 && record.mint !== 'So11111111111111111111111111111111111111112'
      })

      if (!selectedRecord) {
        return
      }

      mintAddress = selectedRecord.mint

      return await getTokenInfo(connection, mintAddress)
    }
  } catch (e) {
    console.log('Error decoding transfer transaction:', e)
  }
}

/**
 * 获取 Token 元数据
 * @param connection
 * @param address
 * @returns
 */
export const getTokenInfo = async (connection: Connection, address: string) => {
  const metaplex = Metaplex.make(connection)
  const mintAddress = new PublicKey(address)
  const mintInfo = await getMint(connection, mintAddress)

  const metadataAccount = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: mintAddress })

  const metadataAccountInfo = await connection.getAccountInfo(metadataAccount)

  if (metadataAccountInfo) {
    const token = await metaplex.nfts().findByMint({ mintAddress: mintAddress })

    return {
      supply: mintInfo.supply,
      name: token.name,
      symbol: token.symbol,
      address
    }
  } else {
    return {}
  }
}
