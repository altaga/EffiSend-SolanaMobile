import { fetchEnhanced } from "../core/fetchEnhanced";
import {CREATE_PAYMENT_URL_API} from '@env';

export async function createPayment(body) {
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
      `${CREATE_PAYMENT_URL_API}`,
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
