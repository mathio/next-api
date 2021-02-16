import React, { useEffect, useState } from 'react'
import * as fetchMethods from '../../fetch'
import { useRouter } from 'next/router'

const prepareBody = (bodyString) => {
  const bodyObj = JSON.parse(bodyString)
  if (typeof bodyObj !== 'object') {
    throw new Error('invalid body')
  }
  return bodyObj
}

const NextApiExplorer = () => {
  const router = useRouter()

  const [inProgress, setInProgress] = useState(false)
  const [path, setPath] = useState('/api/')
  const [method, setMethod] = useState('get')
  const [body, setBody] = useState('{}')
  const [result, setResult] = useState(null)
  const [userEmail, setUserEmail] = useState(null)

  const setValue = (setter) => (event) => setter(event.currentTarget.value)

  const checkSession = async () => {
    const result = await fetchMethods.get('/api/auth')
    setUserEmail(result && result.email)
  }

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    const [savedPath, savedMethod, savedBody] = window.location.hash.slice(1).split('|').map(decodeURIComponent)

    savedPath && setPath(savedPath)
    savedMethod && setMethod(savedMethod)
    savedBody && setBody(savedBody)
  }, [router.asPath])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setInProgress(true)

    const serialized = [encodeURIComponent(path), encodeURIComponent(method), encodeURIComponent(body)].join('|')
    // history.pushState(null, '', `#${serialized}`
    router.push(`#${serialized}`)

    try {
      setResult(await fetchMethods[method](path, prepareBody(body)))
    } catch (error) {
      setResult(`ERROR: ${error.message}`)
    }

    if (path === '/api/auth') {
      await checkSession()
    }

    setInProgress(false)
  }

  return (
    <>
      <h1>next-api</h1>
      {userEmail ? <p>Logged in as: {userEmail}</p> : <p>Not logged in</p>}
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
            disabled={method === 'get' || method === 'del'}
          />
        </p>
        <p>
          <button type="submit">submit</button>
        </p>
      </form>
      {inProgress ? <pre>loading...</pre> : <pre>{JSON.stringify(result, null, 2)}</pre>}
    </>
  )
}

export default NextApiExplorer
