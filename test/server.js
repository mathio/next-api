const { createServer } = require('http')
const { parse } = require('url')
const { nextApi } = require('../lib')

// https://nextjs.org/docs/api-routes/api-middlewares
const addRequestMiddlewares = (req) => {
  const [_, collection] = req.url.match(/^\/api\/([^\^?/]+)/) || []

  const cookies = req.headers.cookie
    .split(';')
    .map((cookie) => {
      const parts = cookie.split('=')
      return [parts.shift().trim(), decodeURI(parts.join('='))]
    })
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})

  const { query } = parse(req.url, true)

  let body = []
  req
    .on('data', (chunk) => {
      body.push(chunk)
    })
    .on('end', () => {
      body = Buffer.concat(body).toString()
    })

  return { ...req, cookies, query: { ...query, collection }, body }
}

// https://nextjs.org/docs/api-routes/response-helpers
const addResponseHelpers = (res) => {
  res.status = (code) => {
    res.statusCode = code
    return res
  }

  res.send = (value) => {
    res.write(value)
    res.end()
  }

  res.json = (value) => {
    res.send(JSON.stringify(value))
  }

  res.redirect = (statusOrPath, pathParam) => {
    const status = pathParam ? statusOrPath : 307
    const path = pathParam || statusOrPath
    res.writeHead(status, { Location: path })
    res.end()
  }

  return res
}

createServer((req, res) => {
  if (!req.url.startsWith('/api/')) {
    res.statusCode = 404
    res.write('next-api available at /api/<collection>')
    return res.end()
  }

  return nextApi(addRequestMiddlewares(req), addResponseHelpers(res))
}).listen(3001)
