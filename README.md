# next-api

[![Test](https://github.com/mathio/next-api/actions/workflows/test-and-release.yml/badge.svg)](https://github.com/mathio/next-api/actions/workflows/test-and-release.yml)
[![npm version](https://img.shields.io/npm/v/@mathio28/next-api?color=brightgreen)](https://www.npmjs.com/package/@mathio28/next-api)

The "no api" api for Next.js apps.

## Installation

```shell
yarn add @mathio28/next-api
```

## Requirements

- node >= 12
- next.js >= 10

## Usage

### Server-side

Installing will automatically create file `/pages/api/[collection].js` with content:

```javascript
import nextApi from 'next-api'
export default nextApi()
```

Specify connection string URL in env variable `MONGODB_URL`.

### Client-side

Use helper methods to make requests to your API endpoints:

```javascript
import { get, post, put, del } from '@mathio28/next-api/fetch'

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

### Client-side with Typescript

The library is written in JavaScript but it provides typings. In a Typescript project you can provide an interface of the object to get type validation:

```typescript
import { get, post } from '@mathio28/next-api/fetch'

interface Card {
  title: string
  text: string
}

const allCards = await get<Card[]>('/api/card')
allCards.forEach((card) => {
  card.title
  card.text
  card._id
  card.userId
  card.created
  card.updated // optional
  card.acl_read
  card.acl_write
  card.tag // TS2339: Property 'tag' does not exist on type 'Card'.
})

await post<Card>('/api/card', { title: 'bar', text: 'foo', tag: 1 })
// TS2345: Argument of type '{ title: string; text: string; tag: number; }' is not assignable to parameter of type 'Card'.
//   Object literal may only specify known properties, and 'tag' does not exist in type 'Card'.
```

## Advanced usage

You can pass config object to `nextApi()`:

```javascript
import nextApi from '@mathio28/next-api'
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

If request body is array multiple objects will be created (one for each object in the array).

Returns created item(s).

### PUT `/api/<collection>`

Update existing item in given collection. Request body sent as JSON is saved.

Specify the item ID as query param `?id=<objectId>` or in body as `_id`.

Returns updated item.

### DELETE `/api/<collection>`

Delete one item with specified ObjectID from given collection.

Specify the item ID as query param `?id=<objectId>` or in body as `_id`. Send `_id` as array to delete multiple objects.

Returns number of deleted items.

### Auth

- `POST /api/auth` create new user (`email` and `pwd` required) or update current user if authorized
- `PUT /api/auth` login with `email` and `pwd` in body (generate token and set cookie)
- `GET /api/auth` get currently logged user (based on cookie)
- `DELETE /api/auth` logout (delete token and cookie)

When you login a HTTP-only cookie will be created with auth token.

### Singleton collections `/api/one-<collection>`

Collections starting with `one-` are considered singletons, eg. `/api/one-config`.

You dont need to specify `id` when retrieving or saving the item, it will always retrieve, create or update one item.

- `GET` returns object, not array
- `PUT` creates new or updates existing item
- `POST` and `DELETE` are not allowed

## Helper methods

To interact with the API you can use methods:

- `get('/api/<collection>')`
- `post('/api/<collection>', { ...data })`
- `put('/api/<collection>', { ...data })`
- `del('/api/<collection>')`
