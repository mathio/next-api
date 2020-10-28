const request = async (path, method, body) => {
  const response = await fetch(path, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return await response.json()
}

export const get = (path) => request(path, 'get')

export const post = (path, body) => request(path, 'post', body)

export const put = (path, body) => request(path, 'put', body)

export const del = (path) => request(path, 'delete')
