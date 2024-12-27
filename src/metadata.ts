import { Metaplex } from '@metaplex-foundation/js'
import { getMint } from '@solana/spl-token'
import { Connection, PublicKey } from '@solana/web3.js'
import { get, pick } from 'lodash'

/**
 * 解析 Mint 交易
 * @param connection
 * @param signature
 * @returns
 */
export const decodeMintTransaction = async (connection: Connection, signature: string) => {
  try {
    const tx = await connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    })

    if (!tx) {
      return null
    }

    let mintAddress = ''

    const txCreate = tx.meta?.innerInstructions?.[0]
    if (txCreate && txCreate.instructions) {
      txCreate.instructions?.forEach((item) => {

        const {
          type,
          info
        } = pick(get(item, 'parsed'), [
          'type',
          'info'
        ])

        if (type === 'initializeMint2') {
          mintAddress = get(info, 'mint')
        }
      })

      if (!mintAddress) {
        return
      }

      const tokenInfo = await getTokenInfo(connection, mintAddress)

      const token = {
        ...tokenInfo,
        address: mintAddress
      }

      return token
    }
  } catch (err) {
    console.error('Error fetching transaction:', err)
  }
}

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

    const fs = require('fs').promises

    // Write transaction data to JSON file
    try {
      await fs.writeFile(
        `signature.json`,
        JSON.stringify(tx, null, 2),
        'utf8'
      )
      console.log(`Transaction ${signature} written to file`)
    } catch (writeErr) {
      console.error('Error writing transaction to file:', writeErr)
    }

    if (!tx) {
      return null
    }
  } catch (err) {
    console.error('Error fetching transaction:', err)
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
      supply: mintInfo.supply.toString(),
      name: token.name,
      symbol: token.symbol,
      logo: token.json?.image
    }
  } else {
    return {}
  }
}
