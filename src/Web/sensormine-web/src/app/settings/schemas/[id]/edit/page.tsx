/**
 * Schema Edit Page
 * 
 * Edit existing schema and create new versions
 * Story 2.2 - Schema Definition Frontend
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SchemaEditor } from '@/components/schemas/schema-editor';
import { Loader2 } from 'lucide-react';
import { getSchema } from '@/lib/api/schemas';
import type { Schema } from '@/lib/types/schema';
import { useToast } from '@/hooks/use-toast';

export default function EditSchemaPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [schema, setSchema] = useState<Schema | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const schemaId = params.id as string;

  useEffect(() => {
    async function loadSchema() {
      try {
        const data = await getSchema(schemaId);
        setSchema(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load schema',
          variant: 'destructive',
        });
        router.push('/settings/schemas');
      } finally {
        setIsLoading(false);
      }
    }

    loadSchema();
  }, [schemaId, router, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!schema) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <SchemaEditor schema={schema} />
    </div>
  );
}
