import CoinList from "@/components/CoinList";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">코인 시세 트래커</h1>
        <p className="text-gray-600">
          바이낸스 API를 활용한 코인 시세 분석 및 추적 서비스입니다.
          관심있는 코인을 추가하고 시세를 확인하세요.
        </p>
      </div>
      
      <CoinList />
    </div>
  );
}