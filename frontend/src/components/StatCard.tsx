import type { ReactNode } from 'react';

export default function StatCard({ icon, label, value }: { icon?: ReactNode; label: string; value: ReactNode }) {
  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '15px' }}>
      {icon}
      <div>
        <span style={{ display: 'block', fontSize: '0.7rem', color: '#9CA3AF' }}>{label}</span>
        <span style={{ fontWeight: 'bold', color: '#2D2424' }}>{value}</span>
      </div>
    </div>
  );
}
