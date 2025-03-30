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
    
    console.log(`[캔들 API] 요청 파라미터: symbol=${symbol}, unit=${unit}, value=${value}, count=${count}`);
    
    let candleData;
    let candleType: 'minute' | 'day' | 'week' | 'month';
    
    // 단위에 따라 적절한 API 호출
    switch (unit) {
      case 'minutes':
        console.log(`[캔들 API] 분 단위 캔들 데이터 요청 중... (${value}분)`);
        candleData = await getMinuteCandles(symbol, parseInt(value) as any, count);
        candleType = 'minute';
        break;
      case 'days':
      case 'weeks':  // 주 단위는 현재 일 단위로 대체
      case 'months': // 월 단위는 현재 일 단위로 대체
        console.log(`[캔들 API] 일/주/월 단위 캔들 데이터 요청 중... (${unit})`);
        candleData = await getDayCandles(symbol, count);
        candleType = unit === 'days' ? 'day' : (unit === 'weeks' ? 'week' : 'month');
        break;
      default:
        console.log(`[캔들 API] 지원하지 않는 단위: ${unit}`);
        return NextResponse.json(
          { error: '지원하지 않는 단위입니다.' },
          { status: 400 }
        );
    }

    // API 응답 확인
    console.log(`[캔들 API] 받은 캔들 데이터: ${candleData ? candleData.length : 0}개 항목`);
    if (candleData && candleData.length > 0) {
      console.log('[캔들 API] 첫 번째 캔들 데이터 샘플:', JSON.stringify(candleData[0]));
    } else {
      console.log('[캔들 API] 캔들 데이터가 없거나 빈 배열입니다.');
    }
    
    // 차트 컴포넌트에서 사용하는 필드와 일치하도록 데이터 변환
    if (candleData && Array.isArray(candleData)) {
      candleData = candleData.map(candle => ({
        timestamp: candle.timestamp,
        opening_price: candle.opening_price,
        high_price: candle.high_price,
        low_price: candle.low_price,
        trade_price: candle.closing_price || candle.trade_price || 0,
        candle_acc_trade_volume: candle.volume || candle.candle_acc_trade_volume || 0,
        candle_acc_trade_price: candle.candle_acc_trade_price || 0
      }));
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
            trade_price: candle.trade_price, // 종가 필드명 대응
            candle_acc_trade_volume: candle.candle_acc_trade_volume || 0,
            candle_acc_trade_price: candle.candle_acc_trade_price || 0,
            candle_type: candleType
          }))
        ).catch(err => console.error('캔들 데이터 저장 오류:', err));
      }
    } catch (dbError) {
      console.error('데이터베이스 저장 오류:', dbError);
      // 데이터베이스 오류는 무시하고 API 데이터만 반환
    }
    
    console.log(`[캔들 API] 응답 전송 중... 데이터 ${candleData ? candleData.length : 0}개 항목`);
    return NextResponse.json(candleData, { status: 200 });
  } catch (error) {
    console.error('캔들 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '캔들 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}