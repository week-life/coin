import { NextRequest, NextResponse } from 'next/server';
import { seedCoins } from '@/scripts/seed-coins';
import { initializeDatabase } from '@/lib/cloudflare-api';

// 관리자 API 키 (보안을 위해 환경 변수에서 가져오거나 다른 방법으로 보호 관리해야 함)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'coin-tracker-admin-key';

// 데이터베이스 초기화 및 코인 데이터 시드 함수
export async function GET(request: NextRequest) {
  try {
    // API 키 검증
    const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('key');
    
    if (apiKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { error: '인증 실패: 유효한 API 키가 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 데이터베이스 초기화
    console.log('데이터베이스 초기화 시작...');
    await initializeDatabase();
    console.log('데이터베이스 초기화 완료!');
    
    // 코인 데이터 추가
    await seedCoins();
    
    return NextResponse.json(
      { success: true, message: '데이터베이스 초기화 및 코인 데이터 추가가 완료되었습니다.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('데이터 초기화 오류:', error);
    return NextResponse.json(
      { error: `데이터 초기화 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}` },
      { status: 500 }
    );
  }
}
