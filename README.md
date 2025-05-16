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
- OK_ACCESS_KEY: Apply from OKX Web3
- OK_ACCESS_SIGN
- OK_ACCESS_PASSPHRASE
- BARK_PUSH_URL: Send notification via Bark application, support iOS only
