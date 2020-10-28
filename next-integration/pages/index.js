import React, { useEffect, useState } from 'react'
import * as fetchMethods from '../../fetch'

const parseCookie = (name) => {
  const [_, value] = document.cookie.match(new RegExp(`${name}=([^;]+)`)) || []
  return value && decodeURIComponent(value)
}

const prepareBody = (bodyString) => {
  const bodyObj = JSON.parse(bodyString)
  if (typeof bodyObj !== 'object') {
    throw new Error('invalid body')
  }
  return bodyObj
}

const NextApiClient = () => {
  const [inProgress, setInProgress] = useState(false)
  const [path, setPath] = useState('/api/')
  const [method, setMethod] = useState('get')
  const [body, setBody] = useState('{}')
  const [result, setResult] = useState(null)

  const setValue = (setter) => (event) => setter(event.currentTarget.value)

  useEffect(() => {
    const savedPath = parseCookie('next-api-path')
    savedPath && setPath(savedPath)

    const savedMethod = parseCookie('next-api-method')
    savedMethod && setMethod(savedMethod)

    const savedBody = parseCookie('next-api-body')
    savedBody && setBody(savedBody)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setInProgress(true)
    document.cookie = `next-api-path=${encodeURIComponent(path)};`
    document.cookie = `next-api-method=${encodeURIComponent(method)};`
    document.cookie = `next-api-body=${encodeURIComponent(body)};`
    try {
      setResult(await fetchMethods[method](path, prepareBody(body)))
    } catch (error) {
      setResult(`ERROR: ${error.message}`)
    }
    setInProgress(false)
  }

  return (
    <>
      <h1>next-api</h1>
      <form onSubmit={handleSubmit}>
        <p>
          <select value={method} onChange={setValue(setMethod)}>
            {Object.keys(fetchMethods).map((method) => (
              <option key={method} value={method}>
                {method.toUpperCase()}
              </option>
            ))}
          </select>{' '}
          <input
            id="next-api-path"
            name="next-api-path"
            type="text"
            value={path}
            onChange={setValue(setPath)}
            size={50}
          />
        </p>
        <p>
          Body:
          <br />
          <textarea
            cols={50}
            rows={10}
            value={body}
            onChange={setValue(setBody)}
            disabled={method === 'get'}
          />
        </p>
        <p>
          <button type="submit">submit</button>
        </p>
      </form>
      {inProgress ? (
        <pre>loading...</pre>
      ) : (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </>
  )
}

export default NextApiClient
