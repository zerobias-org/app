// lib/fetchWithAuth.ts

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const url = typeof input === 'string' ? input : input.url;

  if (url.startsWith('/api/')) {
    const token = process.env.API_KEY || ''; 
    init.headers = {
      ...init.headers,
      Authorization: `APIKey ${token}`,
    };
  }

  return fetch(input, init);
}
