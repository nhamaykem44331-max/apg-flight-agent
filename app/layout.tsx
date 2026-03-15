import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'APG Flight Agent',
  description: 'Vé máy bay Hà Nội đi TP.HCM giá rẻ — Tân Phú APG',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <div className="min-h-screen">
          {children}
          <footer className="mt-10 border-t bg-white py-6 text-center text-sm text-slate-500">
            Giá hiển thị chỉ mang tính tham khảo. Tân Phú APG hỗ trợ tư vấn và đặt chỗ qua đại lý/GDS.
          </footer>
        </div>
      </body>
    </html>
  );
}
