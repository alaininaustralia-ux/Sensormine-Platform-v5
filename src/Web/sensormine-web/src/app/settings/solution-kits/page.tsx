/**
 * Solution Kits Page
 * 
 * Export and import configuration templates as solution kits
 * Includes dependency validation and automatic relationship detection
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, Package } from 'lucide-react';
import { ExportTemplateWizard } from './_components/export-template-wizard';
import { ImportTemplateWizard } from './_components/import-template-wizard';
import { TemplateLibrary } from './_components/template-library';

export default function SolutionKitsPage() {
  const [activeTab, setActiveTab] = useState('library');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Solution Kits</h1>
        <p className="text-muted-foreground mt-2">
          Export and import configuration templates as reusable solution kits.
          Includes dashboards, device types, schemas, alert rules, and more.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="library" className="gap-2">
            <Package className="h-4 w-4" />
            Template Library
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <TemplateLibrary />
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Solution Kit</CardTitle>
              <CardDescription>
                Select the resources you want to export. Dependencies will be automatically included.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExportTemplateWizard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Solution Kit</CardTitle>
              <CardDescription>
                Upload a solution kit template file to import configurations into your tenant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportTemplateWizard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
