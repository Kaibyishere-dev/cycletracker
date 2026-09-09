import React from 'react';

interface SummaryCardProps {
  label: string;
  value: number;
  total?: number;
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  icon: React.ReactNode;
  suffix?: string;
}

const colorMap = {
  blue: 'bg-primary/10 text-primary border-primary/20',
  green: 'bg-success-bg text-success border-success/20',
  amber: 'bg-warning-bg text-warning border-warning/20',
  red: 'bg-danger-bg text-danger border-danger/20',
  purple: 'bg-pending-bg text-pending border-pending/20',
};

const iconBg = {
  blue: 'bg-primary/15 text-primary',
  green: 'bg-success-bg text-success',
  amber: 'bg-warning-bg text-warning',
  red: 'bg-danger-bg text-danger',
  purple: 'bg-pending-bg text-pending',
};

export default function SummaryCard({ label, value, total, color, icon, suffix }: SummaryCardProps) {
  return (
    <div className={`card-base p-4 border ${colorMap[color]} flex items-center gap-4`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-2xl font-bold font-tabular mt-0.5">
          {value}
          {total !== undefined && <span className="text-base font-medium opacity-60"> / {total}</span>}
          {suffix && <span className="text-sm font-medium ml-1 opacity-70">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}