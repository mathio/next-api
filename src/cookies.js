import { getConfig } from './config'

export const getAuthCookie = (cookies) => {
  return cookies && `${cookies[getConfig().authCookieName]}`.split('|')
}

export const setAuthCookie = (req, res, id, token) => {
  const value = [id, token].join('|')
  const secure = process.env.NODE_ENV === 'production'
  const path = req.url.replace(/\/auth$/, '')
  const cookie = [
    `${getConfig().authCookieName}=${id ? value : ''}`,
    `Path=${path}`,
    `SameSite=Lax`,
    secure && 'Secure',
    'HttpOnly',
    !id && 'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ]
  res.setHeader('Set-Cookie', cookie.filter(Boolean).join('; '))
}
