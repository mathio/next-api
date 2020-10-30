const MongoClient = require('mongodb')

const clearDatabase = async () => {
  const client = await MongoClient.connect(process.env.MONGODB_URL, {
    useUnifiedTopology: true,
  })

  client
    .db()
    .listCollections()
    .toArray(async (err, info) => {
      const collections = info
        .filter(
          ({ type, info: { readOnly } }) => type === 'collection' && !readOnly
        )
        .map(({ name }) => name)

      for (const name of collections) {
        await client.db().collection(name).drop()
      }

      await client.close()
    })
}

clearDatabase()
