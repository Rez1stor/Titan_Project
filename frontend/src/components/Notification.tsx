import React from 'react';

export default function Notification({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'success' | 'error' }) {
  const styles: Record<string, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-emerald-50 border-green-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800"
  };
  return <div className={`p-2.5 rounded-lg border ${styles[type]}`}>{children}</div>;
}
