# 코인 트래커 - 암호화폐 시세 분석 웹사이트

빗썸 API를 활용한 암호화폐 시세 분석 및 추적 웹사이트입니다. Next.js와 Cloudflare D1 데이터베이스를 사용해 구현되었습니다.

## 주요 기능

- **코인 목록 조회**: 빗썸에서 거래 가능한 코인 목록 표시
- **코인 추가**: 사용자가 관심있는 코인을 추가할 수 있음
- **즐겨찾기**: 관심 코인을 즐겨찾기에 추가하여 빠르게 확인 가능
- **실시간 시세**: 주기적으로 업데이트되는 코인 시세 정보
- **차트 분석**: 분/일/주/월 단위의 캔들 차트 제공
- **기술적 지표**: 이동평균선, RSI, MACD, 볼린저 밴드 등 기술적 지표 제공

## 기술 스택

- **프론트엔드**: Next.js, React, TypeScript, Chart.js
- **데이터베이스**: Cloudflare D1 (SQLite 기반 서버리스 데이터베이스)
- **API**: 빗썸 공개 API
- **스타일링**: Tailwind CSS

## 사용 방법

1. 프로젝트 클론
```bash
git clone https://github.com/week-life/coin.git
cd coin
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 필요한 환경 변수 설정:
```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_D1_DATABASE_ID=your_database_id
```

4. 개발 서버 실행
```bash
npm run dev
```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## Cloudflare D1 데이터베이스 설정

1. Cloudflare 계정 생성 및 로그인
2. Wrangler CLI 설치: `npm install -g wrangler`
3. Wrangler 로그인: `wrangler login`
4. D1 데이터베이스 생성: `wrangler d1 create coin_trading_data`
5. 스키마 적용: `wrangler d1 execute coin_trading_data --file=./schema.sql`
6. 생성된 데이터베이스 ID를 `wrangler.toml` 파일과 `.env.local` 파일에 설정

## MCP 서버 설정

1. `.mcp/settings.json` 파일에서 API 토큰과 계정 ID를 설정
2. MCP 서버를 통해 Cloudflare D1 데이터베이스에 접근

## 배포

Vercel을 통해 프론트엔드 배포:

```bash
npm run build
vercel --prod
```

## 주의사항

- React 18과 관련 라이브러리 호환성 문제로 최신 버전의 패키지를 사용합니다.
- Cloudflare Worker와 D1을 같이 사용하기 위해 MCP와 Wrangler 설정이 필요합니다.
