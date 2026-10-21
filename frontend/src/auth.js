const defaultApiBase = 'https://mushiness-rehab-fanatic.ngrok-free.dev'
const apiBase = (import.meta.env.DEV ? '' : import.meta.env.VITE_API_BASE_URL ?? defaultApiBase).replace(/\/+$/, '')

export async function authRequest(endpoint, { method = 'POST', body, accessToken } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let response
  try {
    response = await fetch(`${apiBase}/api/Auth/${endpoint}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new Error('Could not reach the AGRIMAN API. Check the API URL and its CORS settings for this frontend.')
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok || result.success === false) {
    const message = response.status === 404
      ? `The AGRIMAN API returned 404 for /api/Auth/${endpoint}. Check that the API server and tunnel expose this route.`
      : result.message || `The authentication request failed (${response.status}).`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return result.data ?? result
}
