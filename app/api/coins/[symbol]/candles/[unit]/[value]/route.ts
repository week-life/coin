import { NextRequest, NextResponse } from 'next/server';
import { getMinuteCandles, getDayCandles } from '@/lib/bithumb-api';
import { getCoinBySymbol, savePriceHistory } from '@/lib/cloudflare-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string; unit: string; value: string } }
) {
  try {
    const { symbol, unit, value } = params;
    const searchParams = request.nextUrl.searchParams;
    const count = searchParams.get('count') ? parseInt(searchParams.get('count') as string) : 100;
    
    let candleData;
    let candleType: 'minute' | 'day' | 'week' | 'month';
    
    // 단위에 따라 적절한 API 호출
    switch (unit) {
      case 'minutes':
        candleData = await getMinuteCandles(symbol, parseInt(value) as any, count);
        candleType = 'minute';
        break;
      case 'days':
      case 'weeks':  // 주 단위는 현재 일 단위로 대체
      case 'months': // 월 단위는 현재 일 단위로 대체
        candleData = await getDayCandles(symbol, count);
        candleType = unit === 'days' ? 'day' : (unit === 'weeks' ? 'week' : 'month');
        break;
      default:
        return NextResponse.json(
          { error: '지원하지 않는 단위입니다.' },
          { status: 400 }
        );
    }
    
    // 데이터베이스에 저장 시도 (비동기로 처리)
    try {
      const coin = await getCoinBySymbol(symbol);
      
      if (coin && candleData && Array.isArray(candleData)) {
        // 백그라운드에서 데이터 저장 (응답 지연 방지)
        Promise.all(
          candleData.map(candle => savePriceHistory({
            coin_id: coin.id,
            timestamp: candle.timestamp,
            opening_price: candle.opening_price,
            high_price: candle.high_price,
            low_price: candle.low_price,
            trade_price: candle.closing_price || candle.trade_price, // 종가 필드명 대응
            candle_acc_trade_volume: candle.volume || candle.candle_acc_trade_volume || 0,
            candle_acc_trade_price: candle.candle_acc_trade_price || 0,
            candle_type: candleType
          }))
        ).catch(err => console.error('캔들 데이터 저장 오류:', err));
      }
    } catch (dbError) {
      console.error('데이터베이스 저장 오류:', dbError);
      // 데이터베이스 오류는 무시하고 API 데이터만 반환
    }
    
    return NextResponse.json(candleData, { status: 200 });
  } catch (error) {
    console.error('캔들 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '캔들 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
