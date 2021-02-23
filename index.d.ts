declare module '@mathio28/next-api' {
  type ApiSecurity = 0 | 1 | 2

  interface ApiConfig {
    mongoDbUrl?: string
    authCookieName?: string
    security?: ApiSecurity
  }

  type ApiHandler = (req: any, res: any) => void

  type MakeApi = (config: ApiConfig) => ApiHandler

  const nextApi: MakeApi
  export = nextApi
}

declare module '@mathio28/next-api/fetch' {
  type UserId = string

  type DocumentId = string

  type Document<T extends {} = {}> = T & {
    _id: DocumentId
    acl_read: UserId[]
    acl_write: UserId[]
    userId: UserId
    created: number
    edited?: number
  }

  type EditedDocument<T extends {}> = Document<T> & {
    edited: number
  }

  interface DeleteResponse {
    deleted: boolean
  }

  type GetResult<T> = T extends Array<infer I> ? Document<I>[] : Document<T>

  export const get: <T extends {} | []>(path: string) => Promise<GetResult<T>>
  export const post: <T extends {}>(path: string, body: T) => Promise<Document<T>>
  export const put: <T extends {}>(path: string, body: T) => Promise<EditedDocument<T>>
  export const del: (path: string) => Promise<DeleteResponse>
}
