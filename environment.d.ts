declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REDIS_URL: string
      SOLANA_RPC_URL: string
      TELEGRAM_BOT_SECRET: string
      WALLET_PRIVATE_KEY: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
