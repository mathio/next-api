import { login, wrapForTesting } from './utils'
import * as fetchMethods from '../src/fetch'

describe('collections', () => {
  let userId
  let authCookie

  let get
  let put
  let post
  let del

  beforeAll(async () => {
    const email = `dev-${Date.now()}@example.com`
    const pwd = 'password123'
    await wrapForTesting(fetchMethods.post)('/api/auth', { email, pwd })
    const response = await login(email, pwd)
    authCookie = response.authCookie
    userId = response.result._id

    get = wrapForTesting(fetchMethods.get, authCookie)
    put = wrapForTesting(fetchMethods.put, authCookie)
    post = wrapForTesting(fetchMethods.post, authCookie)
    del = wrapForTesting(fetchMethods.del, authCookie)
  })

  describe('"post" documents', () => {
    const documents = [
      {
        title: 'Hello',
        text: 'Lorem ipsum.',
        tag: 'short',
      },
      {
        title: 'How are you?',
        text: 'Once upon a time in a galaxy far away.',
        tag: 'long',
      },
      {
        title: 'Goodbye',
        text: 'Lorem ipsum dolor.',
        tag: 'short',
      },
    ]

    it('should create new documents', async () => {
      for (const [index, item] of documents.entries()) {
        documents[index]._id = (await post('/api/post', item))._id
      }

      ;(await get('/api/post?sort=created')).forEach((item, index) => {
        expect(item).toMatchObject({ ...documents[index], userId })
        expect(item.created).toBeDefined()
        expect(item.updated).toBeUndefined()
      })
    })

    it('should return filtered and sorted documents', async () => {
      const result = await get('/api/post?tag=short&sort=created:-1')
      expect(result[0]).toMatchObject(documents[2])
      expect(result[1]).toMatchObject(documents[0])
    })

    it('should return one document', async () => {
      const result = await get(`/api/post?id=${documents[1]._id}`)
      expect(result).toMatchObject(documents[1])
    })

    it('should update document', async () => {
      const postUpdate = {
        title: 'This is a goodbye.',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        category: 'personal',
      }
      const result = await put(`/api/post?id=${documents[2]._id}`, postUpdate)
      expect(result).toMatchObject({
        ...postUpdate,
        _id: documents[2]._id,
      })
      expect(result.created).toBeDefined()
      expect(result.updated).toBeDefined()
    })

    it('should delete document', async () => {
      const result = await del(`/api/post?id=${documents[2]._id}`)
      expect(result).toMatchObject({ deleted: true })
    })

    it('should return remaining documents', async () => {
      const result = await get('/api/post?sort=created')
      expect(result[0]).toMatchObject(documents[0])
      expect(result[1]).toMatchObject(documents[1])
    })

    it('should return error for unauthorized users', async () => {
      const result = await wrapForTesting(fetchMethods.get)('/api/post')
      expect(result.error).toBeDefined()
    })
  })
})
