import { NextRequest, NextResponse } from 'next/server';
import { getTicker, getDayCandles } from '@/lib/upbit-api';

export async function GET(request: NextRequest, {
  params,
}: {
  params: { symbol: string };
}) {
  try {
    const { symbol } = params;
    
    if (!symbol) {
      return NextResponse.json(
        { error: '코인 심볼이 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 업비트 형식으로 변환 (BTC -> KRW-BTC)
    const market = `KRW-${symbol.toUpperCase()}`;
    
    // 현재가 조회
    const tickerData = await getTicker(market);
    let priceData;
    
    if (Array.isArray(tickerData) && tickerData.length > 0) {
      priceData = tickerData[0];
    } else {
      priceData = tickerData;
    }
    
    // 캠들 데이터 조회 (최근 14일)
    const candleData = await getDayCandles(market, 14);
    
    return NextResponse.json({
      current: priceData,
      candles: candleData
    }, { status: 200 });
  } catch (error: any) {
    console.error('개별 코인 가격 정보 조회 오류:', error);
    
    return NextResponse.json(
      { 
        error: '코인 가격 정보를 불러오는 중 오류가 발생했습니다.',
        message: error.message || '알 수 없는 오류' 
      },
      { status: 500 }
    );
  }
}
