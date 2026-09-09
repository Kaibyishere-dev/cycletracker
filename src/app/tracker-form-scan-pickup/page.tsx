import React from 'react';
import AppLayout from '@/components/AppLayout';
import TrackerFormScanPickupContent from './components/TrackerFormScanPickupContent';

export default function TrackerFormScanPickupPage() {
  return (
    <AppLayout activeRoute="/tracker-form-scan-pickup">
      <TrackerFormScanPickupContent />
    </AppLayout>
  );
}