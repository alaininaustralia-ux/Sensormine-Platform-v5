/**
 * Schemas Page
 * 
 * Schema registry list page with search, filters, and actions
 * Story 2.2 - Schema Definition Frontend
 */

import { Suspense } from 'react';
import { SchemaList } from '@/components/schemas/schema-list';
import { SchemaListSkeleton } from '@/components/schemas/schema-list-skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function SchemasPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schema Registry</h1>
          <p className="text-muted-foreground mt-1">
            Define and manage data schemas for your devices and sensors
          </p>
        </div>
        <Link href="/settings/schemas/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Schema
          </Button>
        </Link>
      </div>

      {/* Schema List */}
      <Suspense fallback={<SchemaListSkeleton />}>
        <SchemaList />
      </Suspense>
    </div>
  );
}
