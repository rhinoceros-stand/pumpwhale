import { Connection, PublicKey } from '@solana/web3.js'
import { Metaplex } from '@metaplex-foundation/js'
import { getMint } from '@solana/spl-token'

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

    return {
      name: token.name,
      symbol: token.symbol,
      address: token.address.toBase58(),
      supply: mintInfo.supply,
      decimals: token.mint.decimals
    }
  } else {
    return {}
  }
}
