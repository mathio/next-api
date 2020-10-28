# next-api

The "no api" api for next.js apps. 


## Installation

```
yarn add next-api
```

Create file `/pages/api/[collection].js` with content: 

```
import { nextApi } from 'next-api'
export default nextApi
```

Specify connection string URI in env variable `MONGODB_URL`.

Done!


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

Specify the item ID as query param `?id=<objectId>` or in body as `_id`.
