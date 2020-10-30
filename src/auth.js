import { getAll, getOne, insert, remove, update } from './mongodb'
import { getAuthCookie, setAuthCookie } from './cookies'
import UIDGenerator from 'uid-generator'
import { hashSync, genSaltSync, compareSync } from 'bcrypt'
import { ObjectId } from 'mongodb'
const uidgen = new UIDGenerator(512)

const generateToken = async () => {
  return `${await uidgen.generate()}`
}

const hashPassword = (password) => {
  // https://github.com/kelektiv/node.bcrypt.js#a-note-on-rounds
  return hashSync(password, genSaltSync(12))
}

export const getUser = async (req) => {
  const [id, token] = getAuthCookie(req.cookies)
  if (id && token && id.length === 24) {
    const userAuthToken = await getOne('user_auth_token', {}, id)
    if (userAuthToken.token && compareSync(token, userAuthToken.token)) {
      const { pwd, ...user } = await getOne('user', {}, userAuthToken.userId)
      return user
    }
  }
}

const verifyUser = async (req) => {
  const user = await getUser(req)
  if (user) {
    return [200, user]
  }
}

const addUser = async (req) => {
  const { email, pwd, ...body } = req.body
  if (!email || !pwd || !email.includes('@')) {
    return [400, { error: 'set email and pwd' }]
  }
  const users = await getAll('user', {}, { email })
  if (users.length > 0) {
    return [400, { error: 'email in use' }]
  }
  const user = await insert('user', undefined, {
    email,
    pwd: hashPassword(pwd),
    ...body,
  })
  delete user.pwd
  return [200, user]
}

const editUser = async (req, userId) => {
  const { email, pwd, ...body } = req.body

  if (email) {
    if (!email.includes('@')) {
      return [400, { error: 'invalid email' }]
    }
    const users = await getAll('user', {}, { email, _id: { $ne: userId } })
    if (users.length > 0) {
      return [400, { error: 'email in use' }]
    }
  }

  if (email) {
    body.email = email
  }

  if (pwd) {
    body.pwd = hashPassword(pwd)
  }

  const user = await update('user', undefined, body, userId)
  delete user.pwd
  return [200, user]
}

const addOrEditUser = async (req) => {
  const user = await getUser(req)
  if (user) {
    return editUser(req, user._id)
  } else {
    return addUser(req)
  }
}

const loginUser = async (req, res) => {
  const { email, pwd } = req.body
  const {
    'user-agent': userAgent,
    'x-forwarded-for': xForwardedFor,
  } = req.headers
  const ipAddress = xForwardedFor || req.connection.remoteAddress

  const [user] = await getAll('user', {}, { email })

  if (user && compareSync(pwd, user.pwd)) {
    const token = await generateToken()
    const created = Date.now()
    const authToken = await insert('user_auth_token', user._id, {
      token: hashPassword(token),
      userAgent,
      ipAddress,
      lastAccess: created,
      created,
    })
    setAuthCookie(req, res, authToken._id, token)
    delete user.pwd
    return [200, user]
  }
}

const logoutUser = async (req, res) => {
  const [id] = getAuthCookie(req.cookies)
  if (id && id.length === 24) {
    const { deleted } = await remove('user_auth_token', {}, id)
    if (deleted) {
      setAuthCookie(req, res)
      return [200, {}]
    }
  }
}

const handleAuth = (req, res) => {
  switch (req.method) {
    case 'GET':
      return verifyUser(req)
    case 'POST':
      return addOrEditUser(req, res)
    case 'PUT':
      return loginUser(req, res)
    case 'DELETE':
      return logoutUser(req, res)
  }
}

export const auth = async (req, res) => {
  const [code, result] = (await handleAuth(req, res)) || []
  if (code && result) {
    return res.status(200).json(result)
  }

  return res.status(403).json({
    error: 'unauthorized',
  })
}
