import { getAll, getOne, insert, remove, update } from './mongodb'

const processData = (method, collection, data) => {
  const { query, sort, id, body } = data
  if (method === 'GET' && id) {
    return getOne(collection, id)
  } else if (method === 'GET') {
    return getAll(collection, query, sort)
  } else if (method === 'POST') {
    return insert(collection, body)
  } else if (method === 'PUT') {
    return update(collection, body, id)
  } else if (method === 'DELETE') {
    return remove(collection, id)
  }
  return []
}

export const api = async (req, res) => {
  const { collection, id, sort, ...query } = req.query
  const { _id, ...body } = req.body

  const result = await processData(req.method, collection, {
    query,
    sort,
    id: id || _id || null,
    body,
  })

  return res.status(200).json(result)
}
