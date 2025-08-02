import { AI_URL_API_KEY, CREATE_OR_FETCH_FACEID_API_1, CREATE_OR_FETCH_FACEID_API_2 } from '@env';
import { fetchEnhanced } from '../core/fetchEnhanced';

export async function createOrFetchFace(body) {
  const myHeaders = new Headers();
  myHeaders.append('X-API-Key', AI_URL_API_KEY);
  myHeaders.append('Content-Type', 'application/json');
  const raw = JSON.stringify(body);
  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
  };
  try {
    const response = await fetchEnhanced(
      [
        `${CREATE_OR_FETCH_FACEID_API_1}`,
        `${CREATE_OR_FETCH_FACEID_API_2}`,
      ],
      requestOptions,
    );
    const result = await response.json();
    return result;
  } catch {
    return null;
  }
}
