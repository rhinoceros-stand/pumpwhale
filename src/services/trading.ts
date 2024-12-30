import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js'
import fetch from 'cross-fetch'
import { Wallet } from '@project-serum/anchor'
import bs58 from 'bs58'

const SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112'
const SOL_AMOUNT = 500000

export default class Trading {
  private readonly _connection: Connection

  constructor({ connection }) {
    this._connection = connection
  }

  async getHolders(address: string) {
    const mintAddress = new PublicKey(address)
    const supply = await this._connection.getTokenSupply(mintAddress)
    const topHolders = await this._connection.getTokenLargestAccounts(mintAddress)

    if (!address) {
      return
    }

    const tokenInfo = {
      address,
      amount: supply.value.uiAmount,
      topHolders: topHolders.value.map(v => {
        return {
          address: v.address.toString(),
          amount: v.uiAmount,
          percent: (v.uiAmount / supply.value.uiAmount) * 100
        }
      })
    }

    const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY || '')))

    // Swapping SOL to Mint Address with input 0.001 SOL and 10% slippage
    const quoteResponse = await (
      await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT_ADDRESS}&outputMint=${address}&amount=${SOL_AMOUNT}&slippageBps=1000`
      )
    ).json()

    // get serialized transactions for the swap
    const { swapTransaction } = await (
      await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // quoteResponse from /quote api
          quoteResponse,
          // user public key to be used for the swap
          userPublicKey: wallet.publicKey.toString(),
          // auto wrap and unwrap SOL. default is true
          wrapAndUnwrapSol: true
          // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
          // feeAccount: "fee_account_public_key"
        })
      })
    ).json()

    // deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf)

    // sign the transaction
    transaction.sign([wallet.payer])

    // get the latest block hash
    const latestBlockHash = await this._connection.getLatestBlockhash()

    try {
      // Execute the transaction
      const rawTransaction = transaction.serialize()
      const txid = await this._connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false
      })

      console.log('txid', txid)

      // const confirmInfo = await this._connection.confirmTransaction({
      //   blockhash: latestBlockHash.blockhash,
      //   lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      //   signature: txid
      // })
      // console.log(txid, confirmInfo)
    } catch (e) {
      console.log('error', e)
    }
  }
}
