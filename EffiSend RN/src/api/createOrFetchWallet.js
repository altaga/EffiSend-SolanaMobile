import { CREATE_OR_FETCH_WALLET_API } from '@env';
import { fetchEnhanced } from '../core/fetchEnhanced';

export async function createOrFetchWallet(body) {
  const myHeaders = new Headers();
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
      `${CREATE_OR_FETCH_WALLET_API}`,
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
