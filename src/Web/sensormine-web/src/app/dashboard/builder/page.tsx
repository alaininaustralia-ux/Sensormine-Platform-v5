/**
 * Dashboard Builder Page
 * Page for creating and editing dashboards (Story 4.1)
 */

'use client';

import { DashboardBuilder } from '@/components/dashboard';

export default function DashboardBuilderPage() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <DashboardBuilder />
    </div>
  );
}
