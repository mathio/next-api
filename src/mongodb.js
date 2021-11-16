import { MongoClient, ObjectId } from 'mongodb'
import { getConfig } from './config'

let mongoClient
const getClient = async () => {
  if (!mongoClient) {
    if (process.env.NODE_ENV !== 'production') {
      if (!global.mongoClient) {
        global.mongoClient = await connect()
      }
      mongoClient = global.mongoClient
    } else {
      mongoClient = await connect()
    }
  }
  return mongoClient
}

const connect = () => {
  const url = getConfig().mongoDbUrl
  return MongoClient.connect(url, { useUnifiedTopology: true })
}

const getCollectionClient = async (collection) => {
  const client = await getClient()
  return await client.db().collection(collection)
}

export const getOne = async (collection, authObj, id) => {
  const client = await getCollectionClient(collection)
  const result = await client.findOne({ ...authObj, ...(id ? { _id: ObjectId(id) } : {}) })
  return result || {}
}

export const getAll = async (collection, authObj, query, sort = 'created:-1') => {
  const client = await getCollectionClient(collection)
  const [sortKey, sortDirection] = `${sort}:1`.split(':')
  return await client
    .find({ ...query, ...authObj })
    .sort({ [sortKey]: parseInt(sortDirection, 10) })
    .collation({ locale: 'en_US', numericOrdering: true })
    .toArray()
}

export const insert = async (collection, userId, data) => {
  const client = await getCollectionClient(collection)
  const { _id, ...sanitizedData } = data
  const values = {
    ...sanitizedData,
    userId: ObjectId(userId),
    created: Date.now(),
  }
  const { ops } = await client.insertOne(values)
  return ops[0]
}

export const update = async (collection, authObj, data, id) => {
  const client = await getCollectionClient(collection)
  const values = { ...data, updated: Date.now() }
  const { value } = await client.findOneAndUpdate(
    { _id: ObjectId(id), ...authObj },
    { $set: values },
    { returnOriginal: false }
  )
  return value || {}
}

export const updateOrCreate = async (collection, authObj, data) => {
  const client = await getCollectionClient(collection)
  const item = await client.findOne(authObj)
  const values = { ...data, created: item ? item.created : Date.now(), updated: Date.now() }
  const { value } = await client.findOneAndUpdate(authObj, { $set: values }, { returnOriginal: false, upsert: true })
  return value || {}
}

export const remove = async (collection, authObj, id) => {
  const client = await getCollectionClient(collection)
  const { deletedCount } = await client.deleteOne({
    _id: ObjectId(id),
    ...authObj,
  })
  return {
    deleted: deletedCount,
  }
}

export const removeMany = async (collection, authObj, ids) => {
  const client = await getCollectionClient(collection)
  const { deletedCount } = await client.deleteMany({
    _id: { $in: ids.map((id) => ObjectId(id)) },
    ...authObj,
  })
  return {
    deleted: deletedCount,
  }
}
