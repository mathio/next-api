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

export const login = (email, pwd) => {
  return wrapForTesting(fetch)('/api/auth', {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, pwd }),
  })
}
