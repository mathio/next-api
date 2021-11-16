import { prepareUser } from './utils'

describe('acl', () => {
  const API_PATH = '/api/post'
  let userTom
  let userJerry
  let documents

  beforeAll(async () => {
    userTom = await prepareUser('tom')
    userJerry = await prepareUser('jerry')

    documents = [
      {
        title: 'Hello',
        text: 'Lorem ipsum.',
        tag: 'private',
      },
      {
        title: 'How are you?',
        text: 'Once upon a time in a galaxy far away.',
        tag: 'public-read',
        acl_read: [userJerry.id, userTom.id],
      },
      {
        title: 'Goodbye',
        text: 'Lorem ipsum dolor.',
        tag: 'public-readwrite',
        acl_read: [userJerry.id, userTom.id],
        acl_write: [userJerry.id, userTom.id],
      },
    ]
  })

  it('Jerry creates "post" documents', async () => {
    for (const [index, item] of documents.entries()) {
      documents[index]._id = (await userJerry.post(API_PATH, item))._id
    }

    ;(await userJerry.get(`${API_PATH}?sort=created`)).forEach((item, index) => {
      expect(item._id).toBe(documents[index]._id)
    })
  })

  it("Tom can see only Jerry's public documents", async () => {
    const results = await userTom.get(`${API_PATH}?sort=created`)
    expect(results.length).toBe(2)

    expect(results[0].tag).toBe('public-read')
    expect(results[0].title).toBe('How are you?')
    expect(results[0].updated).toBeUndefined()

    expect(results[1].tag).toBe('public-readwrite')
    expect(results[1].title).toBe('Goodbye')
    expect(results[1].updated).toBeUndefined()
  })

  it("Tom can not edit Jerry's private document", async () => {
    const result = await userTom.put(`${API_PATH}?id=${documents[0]._id}`, { title: 'Bye' })
    expect(result).toEqual({})
  })

  it("Tom can not edit Jerry's public read-only document", async () => {
    const result = await userTom.put(`${API_PATH}?id=${documents[1]._id}`, { title: 'Bye' })
    expect(result).toEqual({})
  })

  it("Tom can edit Jerry's public read-write document", async () => {
    const result = await userTom.put(`${API_PATH}?id=${documents[2]._id}`, { title: 'Bye' })
    expect(result._id).toBe(documents[2]._id)
    expect(result.title).toBe('Bye')
  })

  it('Tom can see updated documents', async () => {
    const results = await userTom.get(`${API_PATH}?sort=created`)
    expect(results.length).toBe(2)

    expect(results[0].tag).toBe('public-read')
    expect(results[0].title).toBe('How are you?')
    expect(results[0].updated).toBeUndefined()

    expect(results[1].tag).toBe('public-readwrite')
    expect(results[1].title).toBe('Bye')
    expect(results[1].updated).toBeDefined()
  })

  it('Jerry can see updated documents too', async () => {
    const results = await userJerry.get(`${API_PATH}?sort=updated:-1`)
    expect(results.length).toBe(3)

    expect(results[0].tag).toBe('public-readwrite')
    expect(results[0].title).toBe('Bye')
    expect(results[0].updated).toBeDefined()

    expect(results[1].tag).toBe('private')
    expect(results[1].title).toBe('Hello')
    expect(results[1].update).toBeUndefined()

    expect(results[2].tag).toBe('public-read')
    expect(results[2].title).toBe('How are you?')
    expect(results[2].updated).toBeUndefined()
  })
})
