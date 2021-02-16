import fetch from 'isomorphic-unfetch'
import * as fetchMethods from '../src/fetch'

/**
 * Define global.fetch for testing. In production fetch is provided by nextjs.
 * Inject auth cookie into the ruest. In production this is done by browser automatically.
 */
export const wrapForTesting = (method, cookie) => (path, ...args) => {
  global.fetch = (path, options) => {
    options.headers = {
      ...(options.headers || {}),
      Cookie: cookie,
    }
    return fetch(path, options)
  }

  return method(`http://localhost:3000${path}`, ...args)
}

/**
 * Login user with email and password.
 * Returns auth cookie and API response.
 */
export const login = async (email, pwd) => {
  const response = await wrapForTesting(fetch)('/api/auth', {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, pwd }),
  })
  let authCookie = null
  const setCookieHeader = response.headers.get('set-cookie')
  if (setCookieHeader) {
    const cookieMatch = `${setCookieHeader}`.match(/^([^;]+)/)
    authCookie = cookieMatch ? cookieMatch[0] : null
  }

  return {
    authCookie,
    result: await response.json(),
  }
}

/**
 * Prepare user account for testing.
 * Creates new account and returns ID and methods authorized as the user.
 */
export const prepareUser = async (prefix) => {
  const email = `${prefix}-${Date.now()}@example.com`
  const pwd = 'password123'
  await wrapForTesting(fetchMethods.post)('/api/auth', { email, pwd })
  const response = await login(email, pwd)
  const id = response.result._id

  const get = wrapForTesting(fetchMethods.get, response.authCookie)
  const put = wrapForTesting(fetchMethods.put, response.authCookie)
  const post = wrapForTesting(fetchMethods.post, response.authCookie)
  const del = wrapForTesting(fetchMethods.del, response.authCookie)

  return {
    id,
    get,
    put,
    post,
    del,
  }
}
