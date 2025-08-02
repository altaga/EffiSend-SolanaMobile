import { AI_URL_API_KEY, FETCH_PAYMENT_URL_API } from '@env';
import { fetchEnhanced } from "../core/fetchEnhanced";

export async function fetchPayment(body) {
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
      `${FETCH_PAYMENT_URL_API}`,
      requestOptions,
    );
    const result = await response.json();
    return result;
  } catch {
     return {
      error: 'BAD API',
      result: null,
    };
  }
}
