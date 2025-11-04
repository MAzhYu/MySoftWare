// Lightweight AI service with OpenAI or Azure OpenAI via REST
// API keys are provided via environment variables by the user.

const DEFAULT_OPENAI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const DEFAULT_DEEPSEEK_MODEL = process.env.AI_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// helper to obtain a fetch function in CommonJS (Node 18+ has global fetch)
async function getFetch() {
  if (typeof global.fetch === 'function') return global.fetch.bind(global);
  const mod = await import('node-fetch');
  return mod.default;
}

class AIService {
  constructor() {
    this.provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  }

  isConfigured() {
    if (this.provider === 'openai') {
      return !!process.env.OPENAI_API_KEY;
    }
    if (this.provider === 'azure-openai') {
      return !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_DEPLOYMENT && process.env.AZURE_OPENAI_API_VERSION);
    }
    if (this.provider === 'deepseek') {
      return !!process.env.DEEPSEEK_API_KEY;
    }
    return false;
  }

  async chat(messages, options = {}) {
    const safeMessages = (messages || []).map(m => ({
      role: String(m.role || 'user'),
      content: String(m.content ?? '').slice(0, 8000)
    }));

    const temperature = typeof options.temperature === 'number' ? options.temperature : 0.7;
    const max_tokens = typeof options.maxTokens === 'number' ? options.maxTokens : 512;

    if (this.provider === 'openai') {
      return this.#chatOpenAI(safeMessages, { temperature, max_tokens, model: options.model || DEFAULT_OPENAI_MODEL });
    }

    if (this.provider === 'azure-openai') {
      return this.#chatAzureOpenAI(safeMessages, { temperature, max_tokens });
    }

    if (this.provider === 'deepseek') {
      return this.#chatDeepSeek(safeMessages, { temperature, max_tokens, model: options.model || DEFAULT_DEEPSEEK_MODEL });
    }

    throw new Error(`Unsupported AI provider: ${this.provider}`);
  }

  async #chatOpenAI(messages, { temperature, max_tokens, model }) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');
    const fetch = await getFetch();

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens })
    });

    const data = await resp.json();
    if (!resp.ok) {
      const msg = data?.error?.message || `OpenAI API error (${resp.status})`;
      throw new Error(msg);
    }

    const choice = data.choices?.[0]?.message;
    return {
      role: choice?.role || 'assistant',
      content: choice?.content || '',
      usage: data.usage || null,
      provider: 'openai',
      model
    };
  }

  async #chatAzureOpenAI(messages, { temperature, max_tokens }) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

    if (!endpoint || !apiKey || !deployment || !apiVersion) {
      throw new Error('Azure OpenAI env vars are not fully set');
    }

    const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
    const fetch = await getFetch();

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages, temperature, max_tokens })
    });

    const data = await resp.json();
    if (!resp.ok) {
      const msg = data?.error?.message || `Azure OpenAI API error (${resp.status})`;
      throw new Error(msg);
    }

    const choice = data.choices?.[0]?.message;
    return {
      role: choice?.role || 'assistant',
      content: choice?.content || '',
      usage: data.usage || null,
      provider: 'azure-openai',
      model: deployment
    };
  }

  async #chatDeepSeek(messages, { temperature, max_tokens, model }) {
    if (!process.env.DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY is not set');
    const fetch = await getFetch();

    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens })
    });

    const data = await resp.json();
    if (!resp.ok) {
      const msg = data?.error?.message || `DeepSeek API error (${resp.status})`;
      throw new Error(msg);
    }

    const choice = data.choices?.[0]?.message;
    return {
      role: choice?.role || 'assistant',
      content: choice?.content || '',
      usage: data.usage || null,
      provider: 'deepseek',
      model
    };
  }
}

module.exports = AIService;
