import { login, wrapForTesting } from './utils'
import * as fetchMethods from '../src/fetch'

describe('auth', () => {
  let _id
  let authCookie
  let secondAuthCookie
  let email
  const pwd = 'password123'
  const fullName = 'Johnny Dev'
  const newFullName = 'Jack Dev'
  const newPwd = 'pwd789'

  beforeAll(() => {
    email = `dev-${Date.now()}@example.com`
  })

  describe('create new account', () => {
    const post = wrapForTesting(fetchMethods.post)

    it('should require email and password', async () => {
      const result = await post('/api/auth', {})
      expect(result.error).toBeDefined()
    })

    it('should validate email', async () => {
      const result = await post('/api/auth', { email: 'dev', pwd: 'dev' })
      expect(result.error).toBeDefined()
    })

    it('should create new account email and return user data', async () => {
      const result = await post('/api/auth', { email, pwd, fullName })
      _id = result._id
      expect(result._id.length).toBe(24)
      expect(result.email).toBe(email)
      expect(result.fullName).toBe(fullName)
      expect(result.pwd).toBeUndefined()
    })

    it('should not allow duplicate emails', async () => {
      const result = await post('/api/auth', { email, pwd, fullName })
      expect(result.error).toBeDefined()
    })
  })

  describe('get user details without auth cookie', () => {
    const get = wrapForTesting(fetchMethods.get)

    it('should fail for unauthorized request', async () => {
      const result = await get('/api/auth')
      expect(result.error).toBeDefined()
    })
  })

  describe('login', () => {
    const put = wrapForTesting(fetchMethods.put)

    it('should fail for invalid credentials', async () => {
      const response = await login(email, 'invalid')
      const result = await response.json()
      expect(result.error).toBeDefined()
    })

    it('should return user data for valid credentials', async () => {
      const response = await login(email, pwd)
      authCookie = response.headers.get('set-cookie').match(/^([^;]+)/)[0]
      const result = await response.json()
      expect(result._id).toBe(_id)
      expect(result.email).toBe(email)
      expect(result.fullName).toBe(fullName)
      expect(result.pwd).toBeUndefined()
    })
  })

  describe('get user details', () => {
    let get
    beforeAll(() => {
      get = wrapForTesting(fetchMethods.get, authCookie)
    })

    it('should return user data for authorized request', async () => {
      const result = await get('/api/auth')
      expect(result._id).toBe(_id)
      expect(result.email).toBe(email)
      expect(result.fullName).toBe(fullName)
      expect(result.pwd).toBeUndefined()
    })
  })

  describe('edit account', () => {
    let post
    beforeAll(() => {
      post = wrapForTesting(fetchMethods.post, authCookie)
    })

    it('should return updated user data for authorized request', async () => {
      const result = await post('/api/auth', {
        fullName: newFullName,
        pwd: newPwd,
      })
      expect(result._id).toBe(_id)
      expect(result.email).toBe(email)
      expect(result.fullName).toBe(newFullName)
      expect(result.pwd).toBeUndefined()
    })
  })

  describe('logout', () => {
    let del
    beforeAll(() => {
      del = wrapForTesting(fetchMethods.del, authCookie)
    })

    it('should logout the user', async () => {
      const result = await del('/api/auth')
      expect(result).toEqual({})
    })

    it('should not logout with invalid auth cookie', async () => {
      const result = await del('/api/auth')
      expect(result.error).toBeDefined()
    })
  })

  describe('login again', () => {
    it('should fail for invalid credentials (with old password)', async () => {
      const response = await login(email, pwd)
      const result = await response.json()
      expect(result.error).toBeDefined()
    })

    it('should return user data for valid credentials (with new password)', async () => {
      const response = await login(email, newPwd)
      authCookie = response.headers.get('set-cookie').match(/^([^;]+)/)[0]
      const result = await response.json()

      expect(result._id).toBe(_id)
      expect(result.email).toBe(email)
      expect(result.fullName).toBe(newFullName)
      expect(result.pwd).toBeUndefined()
    })

    it('should create second session for the user', async () => {
      const response = await login(email, newPwd)
      secondAuthCookie = response.headers.get('set-cookie').match(/^([^;]+)/)[0]
      const result = await response.json()

      expect(result._id).toBe(_id)
    })
  })

  describe('get user details with multiple sessions', () => {
    it('should return user data for first session', async () => {
      const get = wrapForTesting(fetchMethods.get, authCookie)
      const result = await get('/api/auth')
      expect(result._id).toBe(_id)
    })

    it('should return user data for second session', async () => {
      const get = wrapForTesting(fetchMethods.get, secondAuthCookie)
      const result = await get('/api/auth')
      expect(result._id).toBe(_id)
    })

    it('should logout first session', async () => {
      const del = wrapForTesting(fetchMethods.del, authCookie)
      const result = await del('/api/auth')
      expect(result).toEqual({})
    })

    it('should not return user data for first session', async () => {
      console.log(authCookie)
      const get = wrapForTesting(fetchMethods.get, authCookie)
      const result = await get('/api/auth')
      expect(result.error).toBeDefined()
    })

    it('should return user data for second session', async () => {
      const get = wrapForTesting(fetchMethods.get, secondAuthCookie)
      const result = await get('/api/auth')
      expect(result._id).toBe(_id)
    })
  })
})
