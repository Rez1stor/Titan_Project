import type { ReactNode } from 'react';

export default function StatCard({ icon, label, value }: { icon?: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="bg-bg-card p-6 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-[0_4px_15px_rgba(93,64,55,0.03)] hover:shadow-[0_8px_25px_rgba(93,64,55,0.06)] transition-shadow duration-200">
      {icon && <div className="text-brand-color">{icon}</div>}
      <div>
        <span className="block text-xs text-gray-400 font-medium mb-0.5">{label}</span>
        <span className="font-extrabold text-text-main text-lg">{value}</span>
      </div>
    </div>
  );
}
