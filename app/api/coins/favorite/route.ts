import { NextRequest, NextResponse } from 'next/server';
import { toggleFavoriteCoin } from '@/lib/cloudflare-api';

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
    
    const result = await toggleFavoriteCoin(body.symbol);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('즐겨찾기 토글 오류:', error);
    return NextResponse.json(
      { error: '즐겨찾기 설정을 변경하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
