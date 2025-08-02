import { AI_URL_API_KEY, FETCH_FACEID_API_1, FETCH_FACEID_API_2 } from '@env';
import { fetchEnhanced } from "../core/fetchEnhanced";


export async function fetchFaceID(body) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  myHeaders.append('X-API-Key', AI_URL_API_KEY);
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
        `${FETCH_FACEID_API_1}`,
        `${FETCH_FACEID_API_2}`,
      ],
      requestOptions,
    );
    const result = await response.json();
    return result;
  } catch {
    return null;
  }
}
