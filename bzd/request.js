// Simple request wrapper for uni-app
// Note: when running in emulator or on-device, `localhost` may refer to the device
// itself rather than the dev machine. We keep localhost as default for H5, but
// the request wrapper below will attempt common emulator host aliases on failure.
const BASE_URL = 'http://116.62.125.154:5000'

export const api = {
  login: `${BASE_URL}/api/auth/login`,
  me: `${BASE_URL}/api/auth/me`,
  register: `${BASE_URL}/api/auth/register`,
  problems: `${BASE_URL}/api/problems`,
  problemsSubmit: `${BASE_URL}/api/problems/submit`,
  wrongProblems: `${BASE_URL}/api/problems/wrong`,
  profile: `${BASE_URL}/api/auth/profile`,
  aiStatus: `${BASE_URL}/api/ai/status`,
  aiChat: `${BASE_URL}/api/ai/chat`,
  aiExplain: `${BASE_URL}/api/ai/explain`,
  avatarUpload: `${BASE_URL}/api/auth/avatar`
}

export function request({ url, method = 'GET', data = {}, auth = false, headers = {} }) {
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json', ...headers }
    if (auth) {
      const token = uni.getStorageSync('token')
      if (token) header['Authorization'] = `Bearer ${token}`
    }
    // Helper: actually perform the request and return a Promise
    const doRequest = (targetUrl) => new Promise((resResolve, resReject) => {
      uni.request({
        url: targetUrl,
        method,
        data,
        header,
        success: (res) => {
          const { statusCode, data } = res
          if (statusCode >= 200 && statusCode < 300) return resResolve({ ok: true, data })
          if (statusCode === 401) uni.removeStorageSync('token')
          return resResolve({ ok: false, data: data || { message: 'Request failed', statusCode }, statusCode })
        },
        fail: (err) => resReject(err)
      })
    })

    // Try the provided URL first. If it fails with network error and contains 'localhost',
    // attempt common emulator/device aliases to improve developer experience.
    doRequest(url).then(async (r) => {
      if (r.ok) return resolve(r.data)
      // Non-2xx response (e.g., 4xx/5xx) -> reject with server payload
      return reject(r.data)
    }).catch(async (firstErr) => {
      // Network-level failure (e.g., cannot reach host). Try fallbacks if URL refers to localhost.
      try {
        const tried = [url]
        if (url.includes('localhost')) {
          const alternates = [
            url.replace('localhost', '10.0.2.2'), // Android emulator (AVD)
            url.replace('localhost', '10.0.3.2'), // Genymotion
            url.replace('localhost', '127.0.0.1') // explicit loopback
          ]

          for (const alt of alternates) {
            if (tried.includes(alt)) continue
            tried.push(alt)
            try {
              const r2 = await doRequest(alt)
              if (r2.ok) return resolve(r2.data)
              // if server responded with non-2xx, reject with that payload
              return reject(r2.data)
            } catch (e) {
              // continue to next alternate
            }
          }
        }
      } catch (e) {
        // ignore
      }

      // Nothing worked - return original network error
      return reject(firstErr)
    })
  })
}

export default request
