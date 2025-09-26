export default function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="h-2 rounded bg-white/10 overflow-hidden">
      <div className="h-2 bg-[#FF5A2A]" style={{ width: `${v}%` }} />
    </div>
  );
}
