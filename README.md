# pumpwhale

## ⚙️ Commands

### Swap Bot

```bash
pnpm run dev
```

For swap token, will start websocket to fetch SOLUSDT average price.

### Get Bounding Events

```bash
pnpm run bot
```

Launch bot for receive Pump.fun Bounding Logs.
You can configure telegram bot to get notifications.

## 📌 Env file description

- SOLANA_RPC_URL: Connecting to solana blockchain, you can use the default cluster api.
- TELEGRAM_BOT_SECRET: Send message to your telegram bot, you can receive bounding event and transcation news.
- OK_ACCESS_KEY
- OK_ACCESS_SIGN
- OK_ACCESS_PASSPHRASE
