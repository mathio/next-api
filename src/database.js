import { getConfig, SECURITY } from './config'
import { getAll, getOne, insert, removeMany, removeOne, update, updateOrCreate } from './mongodb'

const getAuthObjForRead = (userId) => {
  return { acl_read: { $in: [userId, 'all'] } }
}

const getAuthObjForWrite = (userId) => {
  return { acl_write: { $in: [userId, 'all'] } }
}

const addAclToItem = (item, userId) => {
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
  return item
}

export class Database {
  constructor(user) {
    const userId = user ? user._id.toString() : undefined
    this.userId = userId
    this.user = user
    this.authObjRead = getAuthObjForRead(userId)
    this.authObjWrite = getAuthObjForWrite(userId)
  }

  collectionName(name) {
    return `data_${name}`
  }

  find(collection, idOrQuery, sort) {
    const isSingletonCollection = collection.startsWith('one-')
    if (isSingletonCollection) {
      return getOne(this.collectionName(collection), this.authObjRead)
    } else if (typeof idOrQuery === 'string') {
      return getOne(this.collectionName(collection), this.authObjRead, idOrQuery)
    } else {
      return getAll(this.collectionName(collection), this.authObjRead, idOrQuery, sort)
    }
  }

  async save(collection, body, id) {
    if (getConfig().security !== SECURITY.NONE && !this.userId) {
      return false
    }

    const isSingletonCollection = collection.startsWith('one-')
    if (isSingletonCollection) {
      return updateOrCreate(this.collectionName(collection), this.authObjWrite, addAclToItem(body, this.userId))
    } else if (id) {
      return update(this.collectionName(collection), this.authObjWrite, body, id)
    } else if (Array.isArray(body)) {
      const saved = []
      for (let i = 0; i < body.length; i += 1) {
        saved.push(await insert(this.collectionName(collection), this.userId, addAclToItem(body[i], this.userId)))
      }
      return saved
    } else {
      return insert(this.collectionName(collection), this.userId, addAclToItem(body, this.userId))
    }
  }

  remove(collection, id) {
    if (getConfig().security !== SECURITY.NONE && !this.userId) {
      return false
    }

    const isSingletonCollection = collection.startsWith('one-')
    if (isSingletonCollection) {
      return false
    } else if (Array.isArray(id)) {
      return removeMany(this.collectionName(collection), this.authObjWrite, id)
    } else {
      return removeOne(this.collectionName(collection), this.authObjWrite, id)
    }
  }
}
