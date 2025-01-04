import fetch from 'cross-fetch'
import { createHmac } from 'crypto'
import queryString from 'query-string'

const ACCESS_KEY = process.env.OK_ACCESS_KEY
const SECRET_KEY = process.env.OK_ACCESS_SIGN
const PASSPHRASE_KEY = process.env.OK_ACCESS_PASSPHRASE

/**
 *
 */
export const SOLANA_CHAIN_ID = 501

function getRequestUrl(url: string, params?: any) {
  return queryString.stringifyUrl({
    url: `https://www.okx.com${url}`,
    query: params
  })
}

export function serializeParams(
  params: object | undefined,
  method: String
): string {
  if (!params) {
    return ''
  }

  if (method !== 'GET') {
    return JSON.stringify(params)
  }

  const queryString = Object.keys(params)
    .map((key) => {
      const value = params[key]
      return `${key}=${value}`
    })
    .join('&')

  // Prevent trailing `?` if no params are provided
  return queryString ? '?' + queryString : queryString
}

function signMessage(message: string, secret: string): string {
  return createHmac('sha256', secret).update(message).digest('base64')
}

export default async function (url: string, params?: any, method = 'GET') {
  const requestUrl = getRequestUrl(url, params)

  const tsISO = new Date().toISOString()
  const serializedParams = serializeParams(params, method)
  const message = tsISO + method + url + serializedParams

  return fetch(requestUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': ACCESS_KEY,
      'OK-ACCESS-SIGN': signMessage(message, SECRET_KEY),
      'OK-ACCESS-TIMESTAMP': tsISO,
      'OK-ACCESS-PASSPHRASE': PASSPHRASE_KEY,
      'OK-ACCESS-PROJECT': 'BOT_API'
    },
    body: method === 'GET' ? null : serializedParams
  })
}
