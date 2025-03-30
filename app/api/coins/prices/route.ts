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
    
    const tickerData = await getTicker(symbols);
    
    // 결과 데이터를 심볼을 키로 하는 객체로 변환
    const formattedData: Record<string, any> = {};
    
    if (Array.isArray(tickerData)) {
      tickerData.forEach(data => {
        formattedData[data.market] = data;
      });
    } else if (typeof tickerData === 'object' && tickerData !== null) {
      formattedData[tickerData.market] = tickerData;
    }
    
    return NextResponse.json(formattedData, { status: 200 });
  } catch (error) {
    console.error('코인 가격 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '코인 가격 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
