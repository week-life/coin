import { NextRequest, NextResponse } from 'next/server';
import { toggleFavoriteCoin, getCoinBySymbol } from '@/lib/cloudflare-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.symbol) {
      return NextResponse.json(
        { error: '코인 심볼이 필요합니다.' },
        { status: 400 }
      );
    }
    
    console.log(`즐겨찾기 토글 요청: ${body.symbol}`);
    
    // 토글 전 현재 상태 확인
    const beforeCoin = await getCoinBySymbol(body.symbol);
    console.log('토글 전 코인 상태:', beforeCoin);
    
    // 즐겨찾기 토글 실행
    const result = await toggleFavoriteCoin(body.symbol);
    console.log('토글 결과:', result);
    
    // 토글 후 코인 정보 확인
    const afterCoin = await getCoinBySymbol(body.symbol);
    console.log('토글 후 코인 상태:', afterCoin);
    
    // 변경된 코인 정보 반환
    return NextResponse.json({ 
      success: true, 
      coin: afterCoin,
      is_favorite: afterCoin?.is_favorite || false
    }, { status: 200 });
  } catch (error) {
    console.error('즐겨찾기 토글 오류:', error);
    return NextResponse.json(
      { error: '즐겨찾기 설정을 변경하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
