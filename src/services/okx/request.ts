import fetch from 'cross-fetch'
import cryptoJS from 'crypto-js'
import queryString from 'query-string'

const ACCESS_KEY = process.env.OK_ACCESS_KEY
const SECRET_KEY = process.env.OK_ACCESS_SIGN
const PASSPHRASE_KEY = process.env.OK_ACCESS_PASSPHRASE

export default async function (url: string, params?: any) {
  const requestUrl = getRequestUrl(url, params)

  const date = new Date() // Get the current time
  const timestamp = date.toISOString() // Convert the current time to the desired format

  return fetch(requestUrl, {
    headers: {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': ACCESS_KEY,
      'OK-ACCESS-SIGN': cryptoJS.enc.Base64.stringify(
        cryptoJS.HmacSHA256(`${timestamp}GET${url}${SECRET_KEY}`)
      ),
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': PASSPHRASE_KEY
    }
  })
}

function getRequestUrl(url: string, params?: any) {
  return queryString.stringifyUrl({
    url: `https://www.okx.com/${url}`,
    query: params
  })
}
