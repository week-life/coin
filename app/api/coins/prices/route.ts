import { NextRequest, NextResponse } from 'next/server';
import { getTicker } from '@/lib/bithumb-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols');
    
    if (!symbols) {
      return NextResponse.json(
        { error: '코인 심볼 목록이 필요합니다.' },
        { status: 400 }
      );
    }
    
    console.log('조회할 심볼:', symbols);
    
    // 빗썸 API로 데이터 조회
    const tickerData = await getTicker(symbols);
    console.log('조회된 데이터:', tickerData);
    
    // 결과 데이터를 심볼을 키로 하는 객체로 변환
    const formattedData: Record<string, any> = {};
    
    if (Array.isArray(tickerData) && tickerData.length > 0) {
      tickerData.forEach(data => {
        if (data && typeof data === 'object' && 'market' in data) {
          const symbol = data.market;
          
          // 필요한 필드만 포함시키고 데이터 형식 변환
          formattedData[symbol] = {
            market: `KRW-${symbol}`,
            trade_date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
            trade_time: new Date().toISOString().split('T')[1].substring(0, 8).replace(/:/g, ''),
            trade_date_kst: new Date().toISOString().split('T')[0].replace(/-/g, ''),
            trade_time_kst: new Date().toISOString().split('T')[1].substring(0, 8).replace(/:/g, ''),
            trade_timestamp: Date.now(),
            opening_price: data.opening_price,
            high_price: data.high_price || data.max_price, // 인터페이스에 추가된 속성 사용
            low_price: data.low_price || data.min_price,   // 인터페이스에 추가된 속성 사용
            trade_price: data.trade_price || data.closing_price,
            prev_closing_price: data.prev_closing_price,
            change: data.fluctate_24H > 0 ? 'RISE' : data.fluctate_24H < 0 ? 'FALL' : 'EVEN',
            change_price: Math.abs(data.fluctate_24H || 0),
            change_rate: Math.abs(data.fluctate_rate_24H || 0) / 100,
            signed_change_price: data.fluctate_24H || 0,
            signed_change_rate: data.signed_change_rate || (data.fluctate_rate_24H || 0) / 100,
            trade_volume: data.units_traded || 0,
            acc_trade_price: data.acc_trade_value || 0,
            acc_trade_price_24h: data.acc_trade_value_24H || 0,
            acc_trade_volume: data.units_traded || 0,
            acc_trade_volume_24h: data.units_traded_24H || 0,
            highest_52_week_price: data.max_price || 0,
            highest_52_week_date: new Date().toISOString().split('T')[0],
            lowest_52_week_price: data.min_price || 0,
            lowest_52_week_date: new Date().toISOString().split('T')[0],
            timestamp: Date.now()
          };
        }
      });
    }
    
    return NextResponse.json(formattedData, { status: 200 });
  } catch (error: any) {
    console.error('코인 가격 정보 조회 오류:', error);
    
    // 더 상세한 오류 정보 제공
    return NextResponse.json(
      { 
        error: '코인 가격 정보를 불러오는 중 오류가 발생했습니다.',
        message: error.message || '알 수 없는 오류' 
      },
      { status: 500 }
    );
  }
}
