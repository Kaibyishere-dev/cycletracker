'use client';
import React from 'react';
import AppLayout from '@/components/AppLayout';
import EmailSupplierContent from './components/EmailSupplierContent';

export default function EmailSupplierPage() {
  return (
    <AppLayout activeRoute="/email-supplier">
      <EmailSupplierContent />
    </AppLayout>
  );
}
