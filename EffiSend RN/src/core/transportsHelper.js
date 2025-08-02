import {
  createDefaultRpcTransport,
  createSolanaRpcFromTransport,
} from '@solana/kit';

export function createRpcProvider(rpcEndpoints) {
  const transports = rpcEndpoints.map(url => createDefaultRpcTransport({url}));
  async function failoverTransport(...args) {
    let lastError;
    for (const transport of transports) {
      try {
        return await transport(...args);
      } catch (err) {
        lastError = err;
        console.warn(`Transport failed: ${err}. Trying next transport...`);
      }
    }
    // If all transports fail, throw the last error.
    throw lastError;
  }
  return createSolanaRpcFromTransport(failoverTransport);
}
