export const SECURITY = {
  NONE: 0, // anyone can get, edit and delete all documents
  USER_SANDBOX: 1, // user can get, edit and delete only the documents they created
  READ_ALL: 2, // user can get all documents, but can edit and delete only documents they created
}

const AUTH_COOKIE_NAME = 'next-api-auth'

const defaultConfig = {
  authCookieName: AUTH_COOKIE_NAME,
  security: SECURITY.USER_SANDBOX,
}

export const setConfig = (config) => {
  global.nextApiConfig = { ...defaultConfig, ...config }
}

export const getConfig = () => {
  if (!global.nextApiConfig) {
    throw new Error('nextApiConfig not set')
  }
  return global.nextApiConfig
}
