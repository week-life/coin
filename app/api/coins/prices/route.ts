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
    
    if (Array.isArray(tickerData)) {
      tickerData.forEach(data => {
        if (data && typeof data === 'object' && 'market' in data) {
          const symbol = data.market;
          formattedData[symbol] = data;
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
