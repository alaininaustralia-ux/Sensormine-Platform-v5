/**
 * Create Schema Page
 * 
 * Multi-step wizard for creating new schemas
 * Story 2.2 - Schema Definition Frontend
 */

import { SchemaWizard } from '@/components/schemas/schema-wizard';

export default function CreateSchemaPage() {
  return (
    <div className="container mx-auto py-6">
      <SchemaWizard />
    </div>
  );
}
