import React, { useEffect, useState } from 'react'
import * as fetchMethods from '../../fetch'
import { useRouter } from 'next/router'
import Link from 'next/link'

const prepareBody = (bodyString) => {
  const bodyObj = JSON.parse(bodyString)
  if (typeof bodyObj !== 'object') {
    throw new Error('invalid body')
  }
  return bodyObj
}

const buildUrl = (path, method, body = '{}') => {
  const serialized = [encodeURIComponent(path), encodeURIComponent(method), encodeURIComponent(body)].join('|')
  return `#${serialized}`
}

const logoutUrl = buildUrl('/api/auth', 'del')
const signupUrl = buildUrl('/api/auth', 'post', '{"email":"foo@example.com","pwd":"foobar"}')
const loginUrl = buildUrl('/api/auth', 'put', '{"email":"foo@example.com","pwd":"foobar"}')

const AuthInformation = ({ email }) => {
  if (email === null) {
    return <p>...</p>
  } else if (email) {
    return (
      <p>
        Logged in as: {email}{' '}
        <Link href={logoutUrl}>
          <a>Logout</a>
        </Link>
      </p>
    )
  } else {
    return (
      <p>
        Not logged in.{' '}
        <Link href={signupUrl}>
          <a>Sign up</a>
        </Link>{' '}
        or{' '}
        <Link href={loginUrl}>
          <a>login</a>
        </Link>
        .
      </p>
    )
  }
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

    router.push(buildUrl(path, method, body))

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
      <AuthInformation email={userEmail} />
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
          <textarea cols={50} rows={10} value={body} onChange={setValue(setBody)} disabled={method === 'get'} />
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
