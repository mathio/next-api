import { getAll, getOne, insert, remove, update } from './mongodb'
import { getConfig, SECURITY, setConfig } from './config'
import { auth, getUser } from './auth'

const getAuthObjForRead = (userId) => {
  return { acl_read: { $in: [userId, 'all'] } }
}

const getAuthObjForWrite = (userId) => {
  return { acl_write: { $in: [userId, 'all'] } }
}

const objectIsArray = (obj) => {
  const keys = Object.keys(obj).map((i) => parseInt(i, 10))
  const arr = Array.from(Array(keys.length).keys())
  return JSON.stringify(keys) === JSON.stringify(arr)
}

const saveItem = async (collection, item, userId) => {
  if (!item.acl_read || item.acl_read.length === 0) {
    switch (getConfig().security) {
      case SECURITY.NONE:
      case SECURITY.READ_ALL:
        item.acl_read = ['all']
        break
      case SECURITY.USER_SANDBOX:
        item.acl_read = [userId]
        break
    }
  }
  if (!item.acl_write || item.acl_write.length === 0) {
    switch (getConfig().security) {
      case SECURITY.NONE:
        item.acl_write = ['all']
        break
      case SECURITY.READ_ALL:
      case SECURITY.USER_SANDBOX:
        item.acl_write = [userId]
        break
    }
  }
  return await insert(collection, userId, item)
}

const processData = async (method, collection, data) => {
  const { query, sort, id, body = {}, userId } = data

  if (method === 'GET') {
    const authObj = getAuthObjForRead(userId)
    if (id) {
      return [200, await getOne(collection, authObj, id)]
    } else {
      return [200, await getAll(collection, authObj, query, sort)]
    }
  } else {
    const authObj = getAuthObjForWrite(userId)
    if (getConfig().security !== SECURITY.NONE && !userId) {
      return [403, { error: 'forbidden' }]
    }
    if (method === 'POST') {
      if (objectIsArray(body)) {
        const saved = []
        const keys = Object.keys(body)
        for (let i = 0; i < keys.length; i += 1) {
          saved.push(await saveItem(collection, body[keys[i]], userId))
        }
        return [200, saved]
      } else {
        return [200, await saveItem(collection, body, userId)]
      }
    } else if (method === 'PUT') {
      return [200, await update(collection, authObj, body, id)]
    } else if (method === 'DELETE') {
      return [200, await remove(collection, authObj, id)]
    }
  }
  return {}
}

const makeApi = (config = {}) => {
  setConfig(config)

  return async (req, res) => {
    const { collection, id, sort, ...query } = req.query
    const { _id, ...body } = req.body

    if (collection === 'auth') {
      return auth(req, res)
    }

    const user = await getUser(req)
    const data = {
      query,
      sort,
      id: id || _id || null,
      body,
      userId: user ? user._id.toString() : undefined,
    }

    try {
      const [status, result] = await processData(req.method, `data_${collection}`, data)
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
