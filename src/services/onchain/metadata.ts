import { inRange, toNumber } from 'lodash'
import { Connection, PublicKey } from '@solana/web3.js'
import { getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Metaplex } from '@metaplex-foundation/js'

export async function getTokenMeatData(mintAddress: PublicKey, conn: Connection) {
  const metaplex = Metaplex.make(conn)
  const mintInfo = await getMint(conn, mintAddress)

  const metadataAccount = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: mintAddress })

  const metadataAccountInfo = await conn.getAccountInfo(metadataAccount)
  if (metadataAccountInfo) {
    const token = await metaplex.nfts().findByMint({ mintAddress })
    const holders = await getTokenHolders(mintAddress, conn)

    return {
      name: token.name,
      symbol: token.symbol,
      address: token.address.toBase58(),
      supply: mintInfo.supply,
      decimals: token.mint.decimals,
      json: token.json,
      holders
    }
  } else {
    return {}
  }
}

/**
 * 获取代币持有人数
 * @param mintAddress
 * @param conn
 */
export async function getTokenHolders(mintAddress: PublicKey, conn: Connection) {
  const accounts = await conn.getParsedProgramAccounts(TOKEN_PROGRAM_ID, {
    commitment: 'confirmed',
    filters: [
      {
        dataSize: 165 // Number of bytes for a token account
      },
      {
        memcmp: {
          offset: 0, // Offset to start reading the token mint address
          bytes: mintAddress.toBase58() // The token mint address
        }
      }
    ]
  })

  const holders = accounts
    .filter((account) => {
      // @ts-ignore
      return account.account.data.parsed.info.tokenAmount.uiAmount > 0
    })
    .map((account) => account.pubkey.toBase58())

  return holders.length
}

/**
 * 计算代币市值
 * @param price
 * @param supply
 * @param decimals
 */
export function calcMarketCapitalization(price: number, supply: number, decimals: number) {
  const decimalWithZero = 10 ** decimals
  return Math.trunc(price * (Number(supply) / decimalWithZero))
}

/**
 * 获取价格简写格式
 * 保留四位有效数字
 * @param price
 */
export function getTokenPriceShortly(price: string) {
  const priceZeroCount = -Math.floor(Math.log(Number(price)) / Math.log(10) + 1)
  const startIndex = price.indexOf('.') + priceZeroCount
  return toNumber(price.substring(0, startIndex + 5))
}

/**
 * 获取代币更新优先级
 * @param mc
 */
export function getUpdatePriority(mc: number) {
  let priority = 9

  if (inRange(mc, 0, 9999)) {
    priority = 1
  }

  if (inRange(mc, 10000, 99999)) {
    priority = 2
  }

  if (inRange(mc, 100000, 999999)) {
    priority = 4
  }

  if (inRange(mc, 1000000, 9999990)) {
    priority = 6
  }

  if (mc > 10000000) {
    priority = 9
  }

  return priority
}
