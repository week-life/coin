import CoinList from "@/components/CoinList";

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">즐겨찾기 코인</h1>
        <p className="text-gray-600">
          북마크한 코인들을 모아서 볼 수 있습니다.
          코인 목록에서 별표 아이콘을 클릭하여 즐겨찾기에 추가하세요.
        </p>
      </div>
      
      <CoinList favoritesOnly={true} />
    </div>
  );
}
