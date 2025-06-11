import { environment } from "./zerobias";
export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {

  const url = typeof input === 'string' ? input : input.url;

  if (url.startsWith('/api/')) {
    const token = environment.zerobiasProdApiKey || ''; 
    init.headers = {
      ...init.headers,
      Authorization: `APIKey ${token}`,
    };
  }

  return fetch(input, init);
}
