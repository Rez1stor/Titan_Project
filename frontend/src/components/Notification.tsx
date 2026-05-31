import React from 'react';

export default function Notification({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'success' | 'error' }) {
  const styles: Record<string, React.CSSProperties> = {
    info: { background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E3A8A', padding: 10, borderRadius: 8 },
    success: { background: '#ECFDF5', border: '1px solid #BBF7D0', color: '#065F46', padding: 10, borderRadius: 8 },
    error: { background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: 10, borderRadius: 8 }
  };
  return <div style={styles[type]}>{children}</div>;
}
