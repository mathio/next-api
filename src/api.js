import { getAll, getOne, insert, remove, update } from './mongodb'
import { getConfig, SECURITY, setConfig } from './config'
import { auth, getUser } from './auth'

const getAuthObjForRead = (userId) => {
  return { acl_read: { $in: [userId, 'all'] } }
}

const getAuthObjForWrite = (userId) => {
  return { acl_write: { $in: [userId, 'all'] } }
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
    if (!getConfig().security !== SECURITY.NONE && !userId) {
      return [403, { error: 'forbidden' }]
    }
    if (method === 'POST') {
      if (!body.acl_read || body.acl_read.length === 0) {
        switch (getConfig().security) {
          case SECURITY.NONE:
          case SECURITY.READ_ALL:
            body.acl_read = ['all']
            break
          case SECURITY.USER_SANDBOX:
            body.acl_read = [userId]
            break
        }
      }
      if (!body.acl_write || body.acl_write.length === 0) {
        switch (getConfig().security) {
          case SECURITY.NONE:
            body.acl_write = ['all']
            break
          case SECURITY.READ_ALL:
          case SECURITY.USER_SANDBOX:
            body.acl_write = [userId]
            break
        }
      }
      return [201, await insert(collection, userId, body)]
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
