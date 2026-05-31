import { Star } from 'lucide-react';

export default function ReviewCard({ rev }: { rev: any }) {
  const formatReviewDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())} ${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
  };

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #F3F4F6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: 'bold' }}>{rev.username || 'Anonymous reviewer'}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} fill={i < Number(rev.rating) ? "#F59E0B" : "none"} color={i < Number(rev.rating) ? "#F59E0B" : "#D1D5DB"} />
          ))}
        </div>
      </div>
      <p style={{ margin: 0, color: '#6B7280', lineHeight: '1.6' }}>{rev.comment}</p>
      <small style={{ color: '#D1D5DB', marginTop: '8px', display: 'block' }}>{formatReviewDate(rev.createdAt)}</small>
    </div>
  );
}
