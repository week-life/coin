import { NextRequest, NextResponse } from 'next/server';
import { getTicker } from '@/lib/upbit-api';

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
    
    // 심볼 목록을 업비트 형식에 맞게 변환
    // "BTC,ETH,XRP" 형태를 "KRW-BTC,KRW-ETH,KRW-XRP" 형태로 변환
    const markets = symbols.split(',')
      .map(symbol => `KRW-${symbol.trim()}`)
      .join(',');
    
    console.log('조회할 마켓:', markets);
    
    // 업비트 API로 데이터 조회
    const tickerData = await getTicker(markets);
    
    // 결과 데이터를 심볼을 키로 하는 객체로 변환
    const formattedData: Record<string, any> = {};
    
    if (Array.isArray(tickerData)) {
      tickerData.forEach(data => {
        // 마켓 이름에서 심볼 추출 (KRW-BTC에서 BTC)
        if (data && data.market) {
          const symbol = data.market.split('-')[1];
          formattedData[symbol] = data;
        }
      });
    } else if (tickerData && typeof tickerData === 'object' && 'market' in tickerData) {
      const symbol = tickerData.market.split('-')[1];
      formattedData[symbol] = tickerData;
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
