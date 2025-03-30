import { NextResponse } from 'next/server';
import { getAllMarkets } from '@/lib/bithumb-api';

export async function GET() {
  try {
    const markets = await getAllMarkets(); // 수정: 인자 제거
    
    // 마켓 정보 포맷팅
    const formattedMarkets = markets.map(market => ({
      market: market.market,
      symbol: market.symbol,
      korean_name: market.korean_name,
      english_name: market.english_name
    }));
    
    return NextResponse.json(formattedMarkets, { status: 200 });
  } catch (error) {
    console.error('마켓 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '마켓 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
