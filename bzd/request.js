// Simple request wrapper for uni-app
const BASE_URL = 'http://localhost:5000'

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
  aiExplain: `${BASE_URL}/api/ai/explain`
}

export function request({ url, method = 'GET', data = {}, auth = false, headers = {} }) {
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json', ...headers }
    if (auth) {
      const token = uni.getStorageSync('token')
      if (token) header['Authorization'] = `Bearer ${token}`
    }

    uni.request({
      url,
      method,
      data,
      header,
      success: (res) => {
        const { statusCode, data } = res
        if (statusCode >= 200 && statusCode < 300) return resolve(data)
        if (statusCode === 401) uni.removeStorageSync('token')
        reject(data || { message: 'Request failed', statusCode })
      },
      fail: (err) => reject(err)
    })
  })
}

export default request
