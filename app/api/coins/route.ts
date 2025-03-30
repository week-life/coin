import { NextRequest, NextResponse } from 'next/server';
import { addCoin, getCoins, initializeDatabase } from '@/lib/cloudflare-api';

// 데이터베이스 초기화 함수
let isDbInitialized = false;
const ensureDbInitialized = async () => {
  if (!isDbInitialized) {
    try {
      await initializeDatabase();
      isDbInitialized = true;
    } catch (error) {
      console.error('데이터베이스 초기화 오류:', error);
    }
  }
};

// JSON 안전 변환 함수
function safeJSONify(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

// 코인 목록 조회
export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    // 쿼리 파라미터 확인
    const searchParams = request.nextUrl.searchParams;
    const favoritesOnly = searchParams.get('favorites') === 'true';
    
    const coins = await getCoins(favoritesOnly);
    
    // JSON으로 안전하게 직렬화 가능한 형태로 변환
    const safeCoins = safeJSONify(coins);
    
    return NextResponse.json(safeCoins, { status: 200 });
  } catch (error) {
    console.error('코인 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '코인 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 코인 추가
export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.symbol || !body.market || !body.korean_name || !body.english_name) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }
    
    const result = await addCoin({
      symbol: body.symbol,
      market: body.market,
      korean_name: body.korean_name,
      english_name: body.english_name
    });
    
    // JSON으로 안전하게 직렬화
    return NextResponse.json(safeJSONify(result), { status: 201 });
  } catch (error) {
    console.error('코인 추가 오류:', error);
    return NextResponse.json(
      { error: '코인을 추가하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
