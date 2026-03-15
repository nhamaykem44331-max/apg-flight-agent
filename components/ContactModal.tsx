"use client";
export default function ContactModal({ open, onClose }: { open: boolean; onClose: ()=>void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4" onClick={onClose}>
      <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-5" onClick={e=>e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-bold">Liên hệ đặt vé</h3>
        <p className="mb-3 text-sm text-slate-600">Giá hiển thị là giá tham khảo. Vui lòng liên hệ để chốt chỗ qua đại lý Tân Phú APG.</p>
        <div className="space-y-2 text-sm">
          <div>Hotline: 1900 6091</div>
          <div>Zalo: 09xx xxx xxx</div>
          <div>Telegram: @tanphuapg</div>
          <div>Email: contact@tanphuapg.com</div>
        </div>
        <button className="mt-4 w-full rounded-xl bg-brand py-2 text-white" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
