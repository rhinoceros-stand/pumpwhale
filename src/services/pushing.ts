import axios from 'axios'

export async function sendNotification(title: string, body: string, icon: string) {
  return axios.post(process.env.BARK_PUSH_URL, {
    title,
    body,
    icon,
    copy: body
  })
}
