import React from 'react';
import { Star, Send } from 'lucide-react';
import Button from './Button';
import Notification from './Notification';

export default function ReviewForm({
  currentUser,
  isAuthLoading,
  feedback,
  rating,
  setRating,
  comment,
  setComment,
  onSubmit
}: {
  currentUser: any;
  isAuthLoading: boolean;
  feedback: { kind: 'success' | 'error'; message: string } | null;
  rating: number;
  setRating: (n: number) => void;
  comment: string;
  setComment: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div style={{ background: '#FAF9F6', padding: '20px', borderRadius: '18px', marginBottom: '20px' }}>
      {feedback ? (
        <div style={{ marginBottom: '12px' }}>
          <Notification type={feedback.kind === 'success' ? 'success' : 'error'}>{feedback.message}</Notification>
        </div>
      ) : null}

      {isAuthLoading ? (
        <div style={{ padding: '12px 0', color: '#9CA3AF' }}>Checking sign-in status...</div>
      ) : currentUser ? (
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            {[1, 2, 3, 4, 5].map(num => (
              <Star key={num} size={20} cursor="pointer" fill={num <= rating ? "#F59E0B" : "none"} color={num <= rating ? "#F59E0B" : "#D1D5DB"} onClick={() => setRating(num)} />
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Your tasting notes..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', minHeight: '90px', marginBottom: '10px', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={16} /> Submit review
            </Button>
            <div style={{ alignSelf: 'center', color: '#9CA3AF' }}>Signed in as <strong style={{ color: '#5D4037' }}>{currentUser.username}</strong></div>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#5D4037' }}>Sign in to leave your review.</div>
          <a href="/login" style={{ color: '#A0522D', fontWeight: 800, textDecoration: 'none' }}>Sign In</a>
        </div>
      )}
    </div>
  );
}
