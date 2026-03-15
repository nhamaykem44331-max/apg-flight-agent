import SearchForm from '@/components/SearchForm';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-brand md:text-4xl">Tân Phú APG Flight Agent</h1>
        <p className="mt-2 text-slate-600">Tìm & so sánh giá vé máy bay nhanh chóng cho đại lý.</p>
      </div>
      <SearchForm />
    </main>
  );
}
