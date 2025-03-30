import { NextRequest, NextResponse } from 'next/server';
import { getMinuteCandles, getDayCandles, getWeekCandles, getMonthCandles } from '@/lib/bithumb-api';
import { getCoinBySymbol, savePriceHistory } from '@/lib/cloudflare-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string; unit: string; value: string } }
) {
  try {
    const { symbol, unit, value } = params;
    const searchParams = request.nextUrl.searchParams;
    const count = searchParams.get('count') ? parseInt(searchParams.get('count') as string) : 100;
    const to = searchParams.get('to') || undefined;
    
    let candleData;
    let candleType: 'minute' | 'day' | 'week' | 'month';
    
    // 단위에 따라 적절한 API 호출
    switch (unit) {
      case 'minutes':
        candleData = await getMinuteCandles({
          market: symbol,
          unit: parseInt(value) as any,
          to,
          count
        });
        candleType = 'minute';
        break;
      case 'days':
        candleData = await getDayCandles({
          market: symbol,
          to,
          count
        });
        candleType = 'day';
        break;
      case 'weeks':
        candleData = await getWeekCandles({
          market: symbol,
          to,
          count
        });
        candleType = 'week';
        break;
      case 'months':
        candleData = await getMonthCandles({
          market: symbol,
          to,
          count
        });
        candleType = 'month';
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
            trade_price: candle.trade_price,
            candle_acc_trade_volume: candle.candle_acc_trade_volume,
            candle_acc_trade_price: candle.candle_acc_trade_price,
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
