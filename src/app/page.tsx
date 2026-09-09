import React from 'react';
import AppLayout from '@/components/AppLayout';
import TrackerHasilSOContent from './components/TrackerHasilSOContent';

export default function TrackerHasilSOPage() {
  return (
    <AppLayout activeRoute="/">
      <TrackerHasilSOContent />
    </AppLayout>
  );
}