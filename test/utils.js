import fetch from 'isomorphic-unfetch'

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
