'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCode, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function WidgetUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.name.endsWith('.zip')) {
      setFile(selectedFile);
      setStatus('idle');
    } else {
      setStatus('error');
      setMessage('Please select a valid ZIP file');
    }
  };
  
  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);
  
  // Upload widget
  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setStatus('idle');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/widgets/upload', {
        method: 'POST',
        headers: {
          'X-Tenant-Id': localStorage.getItem('tenantId') || ''
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage(`Widget "${data.widgetId}" v${data.version} uploaded successfully!`);
        setTimeout(() => router.push('/widgets'), 2000);
      } else {
        setStatus('error');
        setMessage(data.detail || 'Upload failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Upload className="w-8 h-8" />
          Upload Custom Widget
        </h1>
        <p className="text-gray-600 mt-2">
          Upload your custom dashboard widget package (ZIP file)
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Widget Package</CardTitle>
          <CardDescription>
            Your package must include manifest.json and index.js
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${file ? 'bg-green-50 border-green-500' : ''}
            `}
          >
            {file ? (
              <div>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="font-medium text-gray-900 mb-1">{file.name}</p>
                <p className="text-sm text-gray-600">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="mt-4"
                >
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div>
                <FileCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="font-medium text-gray-900 mb-2">
                  Drop your widget package here
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  or click to browse
                </p>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input">
                  <Button variant="outline" as="span">
                    Select ZIP File
                  </Button>
                </label>
              </div>
            )}
          </div>
          
          {/* Status Messages */}
          {status === 'success' && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          {status === 'error' && (
            <Alert className="mt-4 bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Requirements */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex gap-2 items-start mb-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Package Requirements:</p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                  <li>ZIP format, maximum 5MB</li>
                  <li>Must include manifest.json with widget metadata</li>
                  <li>Must include index.js as entry point</li>
                  <li>Widget ID must be in reverse domain format (e.g., com.example.widget)</li>
                  <li>Version must follow semantic versioning (e.g., 1.0.0)</li>
                  <li>Only api.query and api.devices permissions allowed</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1"
            >
              {uploading ? 'Uploading...' : 'Upload Widget'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/widgets')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Documentation Link */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Check out the Widget SDK documentation for examples and best practices.
          </p>
          <Button variant="outline" size="sm" as="a" href="/docs/widget-sdk" target="_blank">
            View Documentation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
