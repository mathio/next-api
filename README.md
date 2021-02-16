# next-api

![Test](https://github.com/mathio/next-api/workflows/Test/badge.svg)

The "no api" api for Next.js apps.

## Installation

```shell
yarn add next-api
```

Create file `/pages/api/[collection].js` with content:

```javascript
import nextApi from 'next-api'
export default nextApi()
```

Specify connection string URI in env variable `MONGODB_URL`.

Done!

## Advanced usage

You can pass config object to `nextApi()`:

```javascript
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
