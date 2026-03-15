"use client";
export default function SortBar({ sort, setSort }: { sort: string; setSort: (s: string)=>void }) {
  const opts = [
    ['price','Giá thấp nhất'],
    ['fastest','Nhanh nhất'],
    ['earliest','Sớm nhất'],
  ] as const;
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {opts.map(([k, label]) => (
        <button key={k} className={`rounded-xl px-3 py-2 text-sm ${sort===k?'bg-brand text-white':'border bg-white'}`} onClick={() => setSort(k)}>{label}</button>
      ))}
    </div>
  );
}
