declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SOLANA_RPC_URL: string
      WALLET_PRIVATE_KEY: string
      OK_ACCESS_KEY: string
      OK_ACCESS_SIGN: string
      OK_ACCESS_PASSPHRASE: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
