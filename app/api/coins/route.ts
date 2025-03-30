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
  // obj가 undefined 또는 null인 경우 빈 배열을 반환
  if (obj === undefined || obj === null) {
    return [];
  }
  
  try {
    // 특수 값을 처리하기 위한 함수
    const replacer = (key: string, value: any) => {
      // BigInt 처리
      if (typeof value === 'bigint') {
        return value.toString();
      }
      // Date 객체 처리
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    };
    
    // JSON으로 변환 후 다시 파싱
    return JSON.parse(JSON.stringify(obj, replacer));
  } catch (error) {
    console.error('JSON 변환 오류:', error);
    return [];
  }
}

// 코인 목록 조회
export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    // 쿼리 파라미터 확인
    const searchParams = request.nextUrl.searchParams;
    const favoritesOnly = searchParams.get('favorites') === 'true';
    
    const coins = await getCoins(favoritesOnly);
    
    // 데이터 검증 후 안전하게 변환
    console.log('Retrieved coins:', coins); // 데이터 로깅
    
    // 비어있을 경우를 대비
    if (!coins || !Array.isArray(coins) || coins.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    
    // 응답 데이터 형식 표준화
    const formattedCoins = coins.map(coin => ({
      id: coin.id,
      symbol: coin.symbol,
      market: coin.market || `KRW-${coin.symbol}`, // 마켓 정보가 없을 경우 기본값 설정
      korean_name: coin.korean_name,
      english_name: coin.english_name,
      is_favorite: Boolean(coin.is_favorite),
      added_at: coin.added_at
    }));
    
    return NextResponse.json(formattedCoins, { status: 200 });
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
    
    // 비어있을 경우를 대비
    if (!result) {
      return NextResponse.json({ success: true }, { status: 201 });
    }
    
    return NextResponse.json(safeJSONify(result), { status: 201 });
  } catch (error) {
    console.error('코인 추가 오류:', error);
    return NextResponse.json(
      { error: '코인을 추가하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
