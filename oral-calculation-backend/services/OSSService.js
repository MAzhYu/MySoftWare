// Aliyun OSS upload service
// Env variables required (user will provide values):
// ALIYUN_OSS_ENDPOINT, ALIYUN_OSS_BUCKET, ALIYUN_OSS_REGION,
// ALIYUN_OSS_ACCESS_KEY_ID, ALIYUN_OSS_ACCESS_KEY_SECRET, (optional) ALIYUN_OSS_SECURITY_TOKEN

const OSS = require('ali-oss');
const path = require('path');

function getClient() {
  const {
    ALIYUN_OSS_ENDPOINT,
    ALIYUN_OSS_BUCKET,
    ALIYUN_OSS_REGION,
    ALIYUN_OSS_ACCESS_KEY_ID,
    ALIYUN_OSS_ACCESS_KEY_SECRET,
    ALIYUN_OSS_SECURITY_TOKEN
  } = process.env;

  if (!ALIYUN_OSS_ENDPOINT || !ALIYUN_OSS_BUCKET || !ALIYUN_OSS_REGION || !ALIYUN_OSS_ACCESS_KEY_ID || !ALIYUN_OSS_ACCESS_KEY_SECRET) {
    return null;
  }

  const client = new OSS({
    endpoint: ALIYUN_OSS_ENDPOINT,
    region: ALIYUN_OSS_REGION,
    bucket: ALIYUN_OSS_BUCKET,
    accessKeyId: ALIYUN_OSS_ACCESS_KEY_ID,
    accessKeySecret: ALIYUN_OSS_ACCESS_KEY_SECRET,
    stsToken: ALIYUN_OSS_SECURITY_TOKEN || undefined,
    secure: true
  });

  return client;
}

class OSSService {
  static isConfigured() {
    return !!getClient();
  }

  static async uploadAvatar(buffer, filename, userId) {
    const client = getClient();
    if (!client) throw new Error('OSS not configured');

    const ext = path.extname(filename || '').toLowerCase() || '.png';
    const key = `avatars/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;

    const res = await client.put(key, buffer);
    // res.url is the public URL if bucket policy allows; otherwise format manually
    return res.url || `https://${client.options.bucket}.${client.options.region}.aliyuncs.com/${key}`;
  }
}

module.exports = OSSService;
