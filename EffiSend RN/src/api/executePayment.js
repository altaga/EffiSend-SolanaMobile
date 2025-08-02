import { EXECUTE_PAYMENT_API } from '@env';
import { fetchEnhanced } from "../core/fetchEnhanced";

export async function executePayment(body) {
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
      `${EXECUTE_PAYMENT_API}`,
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
