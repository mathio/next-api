import { prepareUser } from './utils'

describe('collections', () => {
  let user

  beforeAll(async () => {
    user = await prepareUser('dev')
  })

  describe('"article" documents', () => {
    const API_PATH = '/api/article'
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
      documents[0]._id = (await user.post(API_PATH, documents[0]))._id
      ;(await user.post(API_PATH, [documents[1], documents[2]])).forEach(({ _id }, index) => {
        documents[index + 1]._id = _id
      })
      ;(await user.get(`${API_PATH}?sort=created`)).forEach((item, index) => {
        expect(item).toMatchObject({ ...documents[index], userId: user.id })
        expect(item.created).toBeDefined()
        expect(item.updated).toBeUndefined()
      })
    })

    it('should return filtered and sorted documents', async () => {
      const result = await user.get(`${API_PATH}?tag=short&sort=created:-1`)
      expect(result.length).toBe(2)
      expect(result[0]).toMatchObject(documents[2])
      expect(result[1]).toMatchObject(documents[0])
    })

    it('should return one document', async () => {
      const result = await user.get(`${API_PATH}?id=${documents[1]._id}`)
      expect(result).toMatchObject(documents[1])
    })

    it('should update document', async () => {
      const postUpdate = {
        title: 'This is a goodbye.',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        category: 'personal',
      }
      const result = await user.put(`${API_PATH}?id=${documents[2]._id}`, postUpdate)
      expect(result).toMatchObject({
        ...postUpdate,
        _id: documents[2]._id,
      })
      expect(result.created).toBeDefined()
      expect(result.updated).toBeDefined()
    })

    it('should delete document', async () => {
      const result = await user.del(`${API_PATH}?id=${documents[2]._id}`)
      expect(result).toMatchObject({ deleted: 1 })
    })

    it('should return remaining documents', async () => {
      const result = await user.get(`${API_PATH}?sort=created`)
      expect(result[0]).toMatchObject(documents[0])
      expect(result[1]).toMatchObject(documents[1])
    })

    it('should delete remaining documents', async () => {
      const result = await user.del(API_PATH, { _id: documents.map(({ _id }) => _id) })
      expect(result).toMatchObject({ deleted: 2 })
    })

    it('should return zero documents', async () => {
      const result = await user.get(API_PATH)
      expect(result.length).toBe(0)
    })
  })
})
