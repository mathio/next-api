import { getAll, getOne, insert, remove, update } from './mongodb'
import { getConfig, SECURITY, setConfig } from './config'
import { auth, getUser } from './auth'

const getUserIdForRead = (userId) => {
  switch (getConfig().security) {
    case SECURITY.NONE:
      return {}
    case SECURITY.READ_ALL:
      return {}
    case SECURITY.USER_SANDBOX:
      return { userId }
  }
}

const getUserIdForWrite = (userId) => {
  switch (getConfig().security) {
    case SECURITY.NONE:
      return {}
    case SECURITY.READ_ALL:
      return { userId }
    case SECURITY.USER_SANDBOX:
      return { userId }
  }
}

const canAccess = (userIdObj) => {
  if (userIdObj.hasOwnProperty('userId')) {
    return !!userIdObj.userId
  }
  return true
}

const processData = async (method, collection, data) => {
  const { query, sort, id, body = {}, userId } = data

  if (method === 'GET') {
    const userIdObj = getUserIdForRead(userId)
    if (!canAccess(userIdObj)) {
      return [403, { error: 'forbidden ' }]
    }
    if (id) {
      return [200, await getOne(collection, userIdObj, id)]
    } else {
      return [200, await getAll(collection, userIdObj, query, sort)]
    }
  } else {
    const userIdObj = getUserIdForWrite(userId)
    if (!canAccess(userIdObj)) {
      return [403, { error: 'forbidden ' }]
    }
    if (method === 'POST') {
      return [201, await insert(collection, userId, body)]
    } else if (method === 'PUT') {
      return [200, await update(collection, userIdObj, body, id)]
    } else if (method === 'DELETE') {
      return [200, await remove(collection, userIdObj, id)]
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
      userId: user ? user._id : undefined,
    }

    try {
      const [status, result] = await processData(
        req.method,
        `a_${collection}`,
        data
      )
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
