import DashboardGrid from '@/components/dashboard/DashboardGrid'

export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">경제 지표 대시보드</h1>
        <p className="mt-2 text-sm text-slate-400">
          한국·미국·글로벌 주요 경제 지표를 한눈에 확인하세요.
        </p>
      </div>

      <DashboardGrid title="한국 주요 지표" country="KOR" />
      <DashboardGrid title="미국 주요 지표" country="USA" />
      <DashboardGrid title="글로벌 GDP 비교" category="gdp" />
    </div>
  )
}
