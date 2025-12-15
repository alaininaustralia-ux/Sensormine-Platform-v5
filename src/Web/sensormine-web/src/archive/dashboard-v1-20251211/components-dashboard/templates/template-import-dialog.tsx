/**
 * Template Import Dialog Component (Story 4.8)
 * 
 * Allows users to import dashboard templates from JSON files.
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { importTemplate, validateTemplate } from '@/lib/templates/dashboard-templates';

interface TemplateImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export function TemplateImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: TemplateImportDialogProps) {
  const [jsonContent, setJsonContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonContent(content);
      setError(null);
      setSuccess(false);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    setSuccess(false);

    try {
      // Import and validate template
      const template = importTemplate(jsonContent);
      const validation = validateTemplate(template);

      if (!validation.valid) {
        setError(`Invalid template: ${validation.errors.join(', ')}`);
        setIsImporting(false);
        return;
      }

      // Template is valid
      setSuccess(true);
      setTimeout(() => {
        onImportSuccess();
        handleClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import template');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setJsonContent('');
    setError(null);
    setSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Dashboard Template</DialogTitle>
          <DialogDescription>
            Upload a JSON file or paste the template configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <Label htmlFor="file-upload" className="mb-2 block">
              Upload JSON File
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>

          {/* Manual JSON Input */}
          <div>
            <Label htmlFor="json-content" className="mb-2 block">
              Or Paste JSON Content
            </Label>
            <Textarea
              id="json-content"
              value={jsonContent}
              onChange={(e) => {
                setJsonContent(e.target.value);
                setError(null);
                setSuccess(false);
              }}
              placeholder='{"id": "custom-template", "name": "My Template", ...}'
              className="font-mono text-sm min-h-[200px]"
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                Template imported successfully!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!jsonContent.trim() || isImporting || success}
          >
            {isImporting ? 'Importing...' : 'Import Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
