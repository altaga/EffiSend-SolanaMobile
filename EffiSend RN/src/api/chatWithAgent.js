import { AGENT_URL_API, AI_URL_API_KEY } from '@env';
import { fetchEnhanced } from '../core/fetchEnhanced';

export async function chatWithAgent(body) {
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
    const response = await fetchEnhanced(`${AGENT_URL_API}`, requestOptions);
    const result = await response.json();
    return result;
  } catch(e) {
    console.log(e);
    return null;
  }
}
