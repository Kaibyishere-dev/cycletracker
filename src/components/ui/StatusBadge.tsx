import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'scan' | 'adjust';
}

export default function StatusBadge({ status, type = 'scan' }: StatusBadgeProps) {
  const isPositive =
    status === 'Sudah Di Scan' || status === 'Sudah Di Adjust';

  if (isPositive) {
    return (
      <span className="badge-scanned">
        <CheckCircle size={11} />
        {status}
      </span>
    );
  }

  return (
    <span className="badge-pending">
      <Clock size={11} />
      {status}
    </span>
  );
}