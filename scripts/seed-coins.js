const { addCoin } = require('../lib/cloudflare-api');

// 주요 암호화폐 목록
const coinData = [
  {
    symbol: 'BTC',
    market: 'KRW-BTC',
    korean_name: '비트코인',
    english_name: 'Bitcoin'
  },
  {
    symbol: 'ETH',
    market: 'KRW-ETH',
    korean_name: '이더리움',
    english_name: 'Ethereum'
  },
  {
    symbol: 'XRP',
    market: 'KRW-XRP',
    korean_name: '리플',
    english_name: 'Ripple'
  },
  {
    symbol: 'SOL',
    market: 'KRW-SOL',
    korean_name: '솔라나',
    english_name: 'Solana'
  },
  {
    symbol: 'ADA',
    market: 'KRW-ADA',
    korean_name: '에이다',
    english_name: 'Cardano'
  },
  {
    symbol: 'DOGE',
    market: 'KRW-DOGE',
    korean_name: '도지코인',
    english_name: 'Dogecoin'
  },
  {
    symbol: 'MATIC',
    market: 'KRW-MATIC',
    korean_name: '폴리곤',
    english_name: 'Polygon'
  },
  {
    symbol: 'DOT',
    market: 'KRW-DOT',
    korean_name: '폴카닷',
    english_name: 'Polkadot'
  },
  {
    symbol: 'AVAX',
    market: 'KRW-AVAX',
    korean_name: '아발란체',
    english_name: 'Avalanche'
  },
  {
    symbol: 'LINK',
    market: 'KRW-LINK',
    korean_name: '체인링크',
    english_name: 'Chainlink'
  }
];

// 코인 데이터 추가 함수
async function seedCoins() {
  console.log('코인 데이터 추가 시작...');
  
  for (const coin of coinData) {
    try {
      console.log(`${coin.korean_name}(${coin.symbol}) 추가 중...`);
      await addCoin(coin);
      console.log(`${coin.korean_name}(${coin.symbol}) 추가 완료!`);
    } catch (error) {
      console.error(`${coin.korean_name}(${coin.symbol}) 추가 실패:`, error);
    }
  }
  
  console.log('코인 데이터 추가 완료!');
}

// 스크립트가 직접 실행될 때만 seedCoins 함수 실행
if (require.main === module) {
  seedCoins()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { seedCoins };
