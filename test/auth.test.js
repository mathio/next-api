import { login, wrapForTesting } from './utils'
import * as fetchMethods from '../src/fetch'

describe('auth', () => {
  const API_PATH = '/api/auth'
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
      const result = await post(API_PATH, {})
      expect(result.error).toBeDefined()
    })

    it('should validate email', async () => {
      const result = await post(API_PATH, { email: 'dev', pwd: 'dev' })
      expect(result.error).toBeDefined()
    })

    it(`should create new account with email "${email}" and return user data`, async () => {
      const result = await post(API_PATH, { email, pwd, fullName })
      _id = result._id
      expect(result._id.length).toBe(24)
      expect(result.email).toBe(email)
      expect(result.fullName).toBe(fullName)
      expect(result.pwd).toBeUndefined()
    })

    it('should not allow duplicate emails', async () => {
      const result = await post(API_PATH, { email, pwd, fullName })
      expect(result.error).toBeDefined()
    })
  })

  describe('get user details without auth cookie', () => {
    const get = wrapForTesting(fetchMethods.get)

    it('should fail for unauthorized request', async () => {
      const result = await get(API_PATH)
      expect(result.error).toBeDefined()
    })
  })

  describe('login', () => {
    const put = wrapForTesting(fetchMethods.put)

    it('should fail for invalid credentials', async () => {
      const { result } = await login(email, 'invalid')
      expect(result.error).toBeDefined()
    })

    it('should return user data for valid credentials', async () => {
      const response = await login(email, pwd)
      authCookie = response.authCookie
      expect(response.result._id).toBe(_id)
      expect(response.result.email).toBe(email)
      expect(response.result.fullName).toBe(fullName)
      expect(response.result.pwd).toBeUndefined()
    })
  })

  describe('get user details', () => {
    let get
    beforeAll(() => {
      get = wrapForTesting(fetchMethods.get, authCookie)
    })

    it('should return user data for authorized request', async () => {
      const result = await get(API_PATH)
      expect(result._id).toBe(_id)
      expect(result.email).toBe(email)
      expect(result.fullName).toBe(fullName)
      expect(result.pwd).toBeUndefined()
    })
  })

  describe('edit account', () => {
    let post
    let get

    beforeAll(() => {
      post = wrapForTesting(fetchMethods.post, authCookie)
      get = wrapForTesting(fetchMethods.get, authCookie)
    })

    it('should return updated user data for authorized request', async () => {
      const result = await post(API_PATH, {
        fullName: newFullName,
        pwd: newPwd,
      })
      expect(result._id).toBe(_id)
      expect(result.email).toBe(email)
      expect(result.fullName).toBe(newFullName)
      expect(result.pwd).toBeUndefined()
    })

    it('should return new user data after it was edited', async () => {
      const result = await get(API_PATH)
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
      const result = await del(API_PATH)
      expect(result).toEqual({})
    })

    it('should not logout with invalid auth cookie', async () => {
      const result = await del(API_PATH)
      expect(result.error).toBeDefined()
    })
  })

  describe('login again', () => {
    it('should fail for invalid credentials (with old password)', async () => {
      const { result } = await login(email, pwd)
      expect(result.error).toBeDefined()
    })

    it('should return user data for valid credentials (with new password)', async () => {
      const response = await login(email, newPwd)
      authCookie = response.authCookie
      expect(response.result._id).toBe(_id)
      expect(response.result.email).toBe(email)
      expect(response.result.fullName).toBe(newFullName)
      expect(response.result.pwd).toBeUndefined()
    })

    it('should create second session for the user', async () => {
      const response = await login(email, newPwd)
      secondAuthCookie = response.authCookie
      expect(response.result._id).toBe(_id)
    })
  })

  describe('get user details with multiple sessions', () => {
    it('should return user data for first session', async () => {
      const get = wrapForTesting(fetchMethods.get, authCookie)
      const result = await get(API_PATH)
      expect(result._id).toBe(_id)
    })

    it('should return user data for second session', async () => {
      const get = wrapForTesting(fetchMethods.get, secondAuthCookie)
      const result = await get(API_PATH)
      expect(result._id).toBe(_id)
    })

    it('should logout first session', async () => {
      const del = wrapForTesting(fetchMethods.del, authCookie)
      const result = await del(API_PATH)
      expect(result).toEqual({})
    })

    it('should not return user data for first session', async () => {
      const get = wrapForTesting(fetchMethods.get, authCookie)
      const result = await get(API_PATH)
      expect(result.error).toBeDefined()
    })

    it('should return user data for second session', async () => {
      const get = wrapForTesting(fetchMethods.get, secondAuthCookie)
      const result = await get(API_PATH)
      expect(result._id).toBe(_id)
    })
  })
})
