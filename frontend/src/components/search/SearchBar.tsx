'use client'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative flex-1">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <svg
          className="h-5 w-5 text-slate-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="지표명 검색..."
        className="w-full rounded-lg bg-[#1e293b] border border-slate-700 py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
      />
    </div>
  )
}
