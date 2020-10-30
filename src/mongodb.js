import { MongoClient, ObjectId } from 'mongodb'

if (!process.env.MONGODB_URL) {
  throw new Error('MONGODB_URL not set')
}

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
  return MongoClient.connect(process.env.MONGODB_URL, {
    useUnifiedTopology: true,
  })
}

const getCollectionClient = async (collection) => {
  const client = await getClient()
  return await client.db().collection(collection)
}

export const getOne = async (collection, userId, id) => {
  const client = await getCollectionClient(collection)
  const result = await client.findOne({ _id: ObjectId(id), ...userId })
  return result || {}
}

export const getAll = async (
  collection,
  userId,
  query,
  sort = 'created:-1'
) => {
  const client = await getCollectionClient(collection)
  const [sortKey, sortDirection] = `${sort}:1`.split(':')
  return await client
    .find({ ...query, ...userId })
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

export const update = async (collection, userId, data, id) => {
  const client = await getCollectionClient(collection)
  const values = { ...data, updated: Date.now() }
  const { value } = await client.findOneAndUpdate(
    { _id: ObjectId(id), ...userId },
    { $set: values },
    { returnOriginal: false }
  )
  return value || {}
}

export const remove = async (collection, userId, id) => {
  const client = await getCollectionClient(collection)
  const { deletedCount } = await client.deleteOne({
    _id: ObjectId(id),
    ...userId,
  })
  return {
    deleted: deletedCount === 1,
  }
}
