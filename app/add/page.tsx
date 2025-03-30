import AddCoinForm from "@/components/AddCoinForm";

export default function AddCoinPage() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">코인 추가</h1>
        <p className="text-gray-600">
          추적하고 싶은 코인을 추가하세요.
          빗썸에서 거래 가능한 모든 코인을 조회하고 원하는 코인을 추가할 수 있습니다.
        </p>
      </div>
      
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
        <AddCoinForm />
      </div>
    </div>
  );
}
