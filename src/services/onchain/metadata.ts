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
