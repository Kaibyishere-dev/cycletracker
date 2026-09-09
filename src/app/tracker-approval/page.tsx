import React from 'react';
import AppLayout from '@/components/AppLayout';
import TrackerApprovalContent from './components/TrackerApprovalContent';

export default function TrackerApprovalPage() {
  return (
    <AppLayout activeRoute="/tracker-approval">
      <TrackerApprovalContent />
    </AppLayout>
  );
}