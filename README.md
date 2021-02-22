# next-api

![Test](https://github.com/mathio/next-api/workflows/Test/badge.svg)

The "no api" api for Next.js apps.

## Installation

```shell
yarn add https://github.com/mathio/next-api
```

### Server-side

Installing will automatically create file `/pages/api/[collection].js` with content:

```javascript
import nextApi from 'next-api'
export default nextApi()
```

Specify connection string URI in env variable `MONGODB_URL`.

### Client-side

Use helper methods to make requests to your API endpoints:

```javascript
import { get, post, put, del } from 'next-api/fetch'

await post('/api/auth', { email: 'user@example.com', pwd: 'password' }) // sign up
await put('/api/auth', { email: 'user@example.com', pwd: 'password' }) // login

const { _id } = await post('/api/card', { title: 'Hello!' }) // create new card
await put(`/api/card?id=${id}`, { title: 'Bye' }) // edit card (via query param)
await put('/api/card', { _id, title: 'Goodbye' }) // edit card (via _id in payload)
const cards = await get('/api/card') // get all cards
console.log(cards) // array of 1 object
await del(`/api/card?id=${_id}`) // delete card

await del('/api/auth') // logout
```

This works in browser as it takes care of cookies automatically. If you want to make API requests server-side you will 
need to use `fetch` and persist auth cookie manually (named `"next-api-auth"` by default).

## Advanced usage

You can pass config object to `nextApi()`:

```javascript
import nextApi from 'next-api'
import { SECURITY } from 'next-api/config'

export default nextApi({
  mongoDbUrl: '<connection string URI>', // instead of MONGODB_URL env variable
  authCookieName: '<custom name>', // cookie name used for auth (defaults to "next-api-auth")
  security: SECURITY.USER_SANDBOX, // default security settings for database (0, 1, 2), defaults to 1 (SECURITY.USER_SANDBOX)
})
```

Available settings for security (integer):

- `SECURITY.NONE` (0) - no security, anyone can get, edit and delete all documents
- `SECURITY.USER_SANDBOX` (1) - user can get, edit and delete only the documents they created
- `SECURITY.READ_ALL` (2) - user can get all documents, but can edit and delete only documents they created

You can override those settings for each record you save by setting `acl_read` and `acl_write` as an array of user ids. 


## API Docs

### GET `/api/<collection>`

Returns array of all items from given collection.

Sort by `sort` query param, eg. `?sort=date` ascending, `?sort=date:-1` descending.

Filter by specifying additional query params, eg. `?age=18`.

When ID query param is specified `?id=<objectId>` it will return only the item, not an array.

### POST `/api/<collection>`

Create a new item in given collection. Request body sent as JSON is saved.

Returns created item.

### PUT `/api/<collection>`

Update existing item in given collection. Request body sent as JSON is saved.

Specify the item ID as query param `?id=<objectId>` or in body as `_id`.

Returns updated item.

### DELETE `/api/<collection>`

Delete one item with specified ObjectID from given collection.

Specify the item ID as query param `?id=<objectId>`.

### Auth

- `POST /api/auth` create new user (`email` and `pwd` required) or update current user if authorized
- `PUT /api/auth` login with `email` and `pwd` in body (generate token and set cookie)
- `GET /api/auth` get currently logged user (based on cookie)
- `DELETE /api/auth` logout (delete token and cookie)

When you login a HTTP-only cookie will be created with auth token.

## Helper methods

To interact with the API you can use methods:

- `get('/api/<collection>')`
- `post('/api/<collection>', { ...data })`
- `put('/api/<collection>', { ...data })`
- `del('/api/<collection>')`
