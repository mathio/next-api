import { MongoClient, ObjectId } from 'mongodb'
import { getConfig } from './config'

global.cachedClient = null
global.cachedDb = null

const getClient = async () => {
  if (global.cachedClient && global.cachedDb) {
    return {
      client: global.cachedClient,
      db: global.cachedDb,
    }
  }

  const uri = getConfig().mongoDbUrl
  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  const db = await client.db()

  global.cachedClient = client
  global.cachedDb = db

  return { client, db }
}

const getCollectionClient = async (collection) => {
  const { db } = await getClient()
  return await db.collection(collection)
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
  const { insertedId } = await client.insertOne(values)
  return await getOne(collection, {}, insertedId)
}

export const update = async (collection, authObj, data, id) => {
  const client = await getCollectionClient(collection)
  const values = { ...data, updated: Date.now() }
  await client.findOneAndUpdate({ _id: ObjectId(id), ...authObj }, { $set: values })
  return await getOne(collection, authObj, ObjectId(id))
}

export const updateOrCreate = async (collection, authObj, data) => {
  const client = await getCollectionClient(collection)
  const item = await client.findOne(authObj)
  const values = { ...data, created: item ? item.created : Date.now(), updated: Date.now() }
  const {
    lastErrorObject: { upserted },
    value,
  } = await client.findOneAndUpdate(authObj, { $set: values }, { upsert: true })
  const id = upserted || value._id
  return await getOne(collection, {}, id)
}

export const removeOne = async (collection, authObj, id) => {
  const client = await getCollectionClient(collection)
  const { deletedCount } = await client.deleteOne({
    _id: ObjectId(id),
    ...authObj,
  })
  return deletedCount
}

export const removeMany = async (collection, authObj, ids) => {
  const client = await getCollectionClient(collection)
  const { deletedCount } = await client.deleteMany({
    _id: { $in: ids.map((id) => ObjectId(id)) },
    ...authObj,
  })
  return deletedCount
}
