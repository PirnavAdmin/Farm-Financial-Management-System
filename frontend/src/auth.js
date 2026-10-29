import api, { BUSINESS_API_BASE_URL } from './services/api'

const routes = {
  login: '/api/Auth/login',
  register: '/api/Auth/register',
  'forgot-password': '/api/Auth/forgot-password',
  'verify-otp': '/api/Auth/verify-otp',
  'reset-password': '/api/Auth/reset-password',
  'login-history': '/api/Auth/login-history',
  me: '/api/v1/auth/me',
}

export async function authRequest(endpoint, { method = 'POST', body, accessToken } = {}) {
  const route = routes[endpoint]
  if (!route) throw new Error(`Unsupported authentication endpoint: ${endpoint}`)
  const identifier = body?.identifier || body?.email || ''
  const requestBody = endpoint === 'login'
    ? { identifier, password: body?.password, rememberMe: body?.rememberMe }
    : endpoint === 'register'
      ? { fullName: body?.fullName || body?.name, email: identifier, phoneNumber: body?.phoneNumber || body?.mobileNumber, password: body?.password, role: body?.role }
      : endpoint === 'forgot-password'
        ? { identifier }
        : endpoint === 'verify-otp'
          ? { identifier, otp: body?.otp }
          : endpoint === 'reset-password'
            ? { identifier, ...(body?.resetToken || body?.token ? { resetToken: body.resetToken || body.token } : { otp: body?.otp }), newPassword: body?.newPassword, confirmPassword: body?.confirmPassword }
            : body
  try {
    const response = await api.request({ baseURL: BUSINESS_API_BASE_URL, url: route, method, data: requestBody, headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined })
    const result = response.data
    if (result?.success === false) throw new Error(result.message || 'The authentication request failed.')
    return result?.data ?? result
  } catch (error) {
    const data = error.response?.data
    const fail = (message) => {
      const requestError = new Error(message)
      requestError.status = error.response?.status
      throw requestError
    }
    if (data?.errors && typeof data.errors === 'object') {
      const details = Object.entries(data.errors).flatMap(([field, messages]) => (Array.isArray(messages) ? messages : [messages]).map((message) => `${field}: ${message}`)).join(' ')
      if (details) fail(details)
    }
    if (data?.detail || data?.message || data?.title) fail(data.detail || data.message || data.title)
    if (error.friendlyMessage) fail(error.friendlyMessage)
    if (error.message && error.message !== 'Network Error') throw error
    throw new Error('Could not reach the AGRIMAN API. Check that the backend and its tunnel are running.')
  }
}
