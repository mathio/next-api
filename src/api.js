import { getConfig, SECURITY, setConfig } from './config'
import { auth, getUser } from './auth'
import { Database } from './database'

const objectIsArray = (obj) => {
  const keys = Object.keys(obj).map((i) => parseInt(i, 10))
  const arr = Array.from(Array(keys.length).keys())
  return JSON.stringify(keys) === JSON.stringify(arr)
}

const processData = async (method, collection, data, db) => {
  const { query, sort, id, body = {}, userId } = data

  if (method === 'GET') {
    return [200, await db.find(collection, id || query, sort)]
  } else {
    if (getConfig().security !== SECURITY.NONE && !userId) {
      return [403, { error: 'forbidden' }]
    }
    if (method === 'POST') {
      const isSingletonCollection = collection.startsWith('one-')
      if (isSingletonCollection) {
        return [400, { error: 'singleton, use put instead' }]
      } else if (objectIsArray(body)) {
        return [200, await db.save(collection, Object.values(body), null)]
      } else {
        return [200, await db.save(collection, body)]
      }
    } else if (method === 'PUT') {
      return [200, await db.save(collection, body, id)]
    } else if (method === 'DELETE') {
      const deleted = await db.remove(collection, id)
      if (deleted === false) {
        return [400, { error: 'singleton, use put instead' }]
      } else {
        return [200, { deleted }]
      }
    }
  }
  return {}
}

const getCollectionFromRequest = (req) => {
  if (req.query.collection) {
    return req.query.collection
  }
  const match = req.url.match(/\/api\/([^/]+)/)
  return match && match[1]
}

const makeApi = (config = {}, before, after) => {
  setConfig(config)

  return async (req, res) => {
    if (req.query.collection === 'auth') {
      return auth(req, res)
    }

    const user = await getUser(req)
    const userId = user ? user._id.toString() : undefined

    const db = new Database(user)

    if (before) {
      const canContinue = await before(req, res, db)
      if (canContinue === false) {
        return
      }
    }

    const { id, sort, ...query } = req.query
    const { _id, ...body } = req.body
    const collection = getCollectionFromRequest(req)
    delete query.collection

    const data = {
      query,
      sort,
      id: id || _id || null,
      body,
      userId,
    }

    try {
      const [status, result] = await processData(req.method, collection, data, db)

      if (after) {
        const canReturn = await after(req, res, db)
        if (canReturn === false) {
          return
        }
      }

      return res.status(status).json(result)
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        error: error.message,
      })
    }
  }
}

export default makeApi
