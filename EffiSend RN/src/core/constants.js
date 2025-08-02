import { Dimensions, Image, PixelRatio } from 'react-native';
// Blockchain
import BONK from '../assets/logos/bonk.png';
import JUP from '../assets/logos/jup.png';
import SOL from '../assets/logos/sol.png';
import USDC from '../assets/logos/usdc.png';
import USDT from '../assets/logos/usdt.png';
import WBTC from '../assets/logos/wbtc.png';

const normalizeFontSize = size => {
  let {width, height} = Dimensions.get('window');
  const scale = Math.min(width / 375, height / 667); // Based on a standard screen size
  return PixelRatio.roundToNearestPixel(size * scale);
};

const w = normalizeFontSize(40);
const h = normalizeFontSize(40);

export const refreshTime = 1000 * 60 * 1;

export const iconsBlockchain = {
  sol: <Image source={SOL} style={{width: w, height: h, borderRadius: 10}} />,
  bonk: <Image source={BONK} style={{width: w, height: h, borderRadius: 10}} />,
  usdc: <Image source={USDC} style={{width: w, height: h, borderRadius: 10}} />,
  usdt: <Image source={USDT} style={{width: w, height: h, borderRadius: 10}} />,
  wbtc: <Image source={WBTC} style={{width: w, height: h, borderRadius: 10}} />,
  jup: <Image source={JUP} style={{width: w, height: h, borderRadius: 10}} />,
};

export const blockchain = {
  network: 'Solana',
  blockExplorer: 'https://explorer.solana.com/',
  rpcs: [
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana',
    'https://solana.api.onfinality.io/public',
    'https://solana.drpc.org',
  ],
  tokens: [
    {
      name: 'Solana',
      color: '#9349f1',
      symbol: 'SOL',
      address:
        'So11111111111111111111111111111111111111111',
      decimals: 9,
      icon: iconsBlockchain.sol,
      coingecko: 'solana',
    },
    {
      name: 'USD Coin',
      color: '#2775ca',
      symbol: 'USDC',
      address:
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
      icon: iconsBlockchain.usdc,
      coingecko: 'usd-coin',
    },
    {
      name: 'Tether USD',
      color: '#008e8e',
      symbol: 'USDT',
      address:
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      decimals: 6,
      icon: iconsBlockchain.usdt,
      coingecko: 'tether',
    },
    {
      name: "Bonk",
      color: '#f9de39',
      symbol: 'BONK',
      address:
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      decimals: 5,
      icon: iconsBlockchain.bonk,
      coingecko: 'bonk',
    },
    {
      name: "Wrapped BTC",
      color: '#f8931a',
      symbol: 'BTC',
      address:
        '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
      decimals: 8,
      icon: iconsBlockchain.wbtc,
      coingecko: 'wrapped-bitcoin',
    },
    {
      name: "Jupiter",
      color: '#16bede',
      symbol: 'JUP',
      address:
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
      decimals: 6,
      icon: iconsBlockchain.jup,
      coingecko: 'jupiter-exchange-solana',
    }
  ],
};
