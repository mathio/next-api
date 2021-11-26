type UserId = string

type DocumentId = string

type DocumentObj<T extends {} = {}> = T & {
  _id: DocumentId
  acl_read: UserId[]
  acl_write: UserId[]
  userId: UserId
  created: number
  edited?: number
}

declare module '@mathio28/next-api' {
  type ApiSecurity = 0 | 1 | 2

  interface ApiConfig {
    mongoDbUrl?: string
    authCookieName?: string
    security?: ApiSecurity
    sessionTime?: number
  }

  type GetResult<T> = T extends Array<infer I> ? DocumentObj<I>[] : DocumentObj<T>

  type Database = {
    find: <T extends {}>(collection: string, idOrQuery: string | {}, sort?: string) => GetResult<T>
    save: <T extends {}>(collection: string, body: T, id?: string) => GetResult<T>
    remove: (collection: string, id: string | string[]) => number
  }

  type ApiHandler = (req: any, res: any) => void
  type ApiHandlerWithDb = (req: any, res: any, db: Database) => void

  type MakeApi = (config: ApiConfig, before?: ApiHandlerWithDb, after?: ApiHandlerWithDb) => ApiHandler

  const nextApi: MakeApi
  export = nextApi
}

declare module '@mathio28/next-api/fetch' {
  type EditedDocument<T extends {}> = DocumentObj<T> & {
    edited: number
  }

  type DeleteBody = {
    _id: string | string[]
  }

  interface DeleteResponse {
    deleted: number
  }

  type GetResult<T> = T extends Array<infer I> ? DocumentObj<I>[] : DocumentObj<T>

  export const get: <T extends {} | []>(path: string) => Promise<GetResult<T>>
  export const post: <T extends {} | []>(path: string, body: T) => Promise<GetResult<T>>
  export const put: <T extends {}>(path: string, body: T) => Promise<EditedDocument<T>>
  export const del: (path: string, body?: DeleteBody) => Promise<DeleteResponse>
}
