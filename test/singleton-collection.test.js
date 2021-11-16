import { prepareUser } from './utils'

describe('singleton collections', () => {
  let user

  beforeAll(async () => {
    user = await prepareUser('dev')
  })

  describe('"one-config" document', () => {
    const API_PATH = '/api/one-config'
    let savedDocument
    let newSavedDocument
    const document = {
      gps: true,
      threshold: 10,
      transmission: 'manual',
    }

    it('should return empty document', async () => {
      expect(await user.get(API_PATH)).toEqual({})
    })

    it('should fail on POST', async () => {
      const { error } = await user.post(API_PATH, document)
      expect(error).toBeDefined()
    })

    it('should create new document', async () => {
      savedDocument = await user.put(API_PATH, document)
      expect(savedDocument).toMatchObject(document)
    })

    it('should return document', async () => {
      expect(await user.get(API_PATH)).toEqual(savedDocument)
    })

    it('should update existing document', async () => {
      newSavedDocument = await user.put(API_PATH, { gps: false })
      expect(newSavedDocument).toMatchObject({ ...savedDocument, updated: newSavedDocument.updated, gps: false })
    })

    it('should return document', async () => {
      expect(await user.get(API_PATH)).toEqual(newSavedDocument)
    })

    it('should fail on DELETE', async () => {
      const { error } = await user.post(API_PATH, document)
      expect(error).toBeDefined()
    })
  })
})
