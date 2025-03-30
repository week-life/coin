import { NextResponse } from 'next/server';
import { getAllMarkets } from '@/lib/bithumb-api';

export async function GET() {
  try {
    const markets = await getAllMarkets(true); // 상세 정보 포함
    
    // KRW 마켓만 필터링
    const krwMarkets = Object.entries(markets)
      .filter(([market]) => market.startsWith('KRW-'))
      .map(([market, data]: [string, any]) => ({
        market,
        korean_name: data.korean_name,
        english_name: data.english_name,
        market_warning: data.market_warning
      }));
    
    return NextResponse.json(krwMarkets, { status: 200 });
  } catch (error) {
    console.error('마켓 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '마켓 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
