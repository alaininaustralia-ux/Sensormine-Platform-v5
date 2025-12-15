/**
 * Developer Help Page
 * 
 * Comprehensive help and documentation for developers using the Sensormine Platform
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Code, FileCode, Package, Cpu, Database, Cloud, Terminal, 
  BookOpen, ExternalLink, Lightbulb, CheckCircle, Info
} from 'lucide-react';
import Link from 'next/link';

export default function DeveloperHelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Developer Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive guides and references for building on the Sensormine Platform
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="widgets">Custom Widgets</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
          <TabsTrigger value="guides">How-To Guides</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Platform Overview
              </CardTitle>
              <CardDescription>
                Sensormine is a cloud-agnostic industrial IoT platform built with microservices architecture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    Backend
                  </h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• .NET 8 with C# 12</li>
                    <li>• Microservices architecture</li>
                    <li>• Event-driven design (Kafka)</li>
                    <li>• TimescaleDB for time-series data</li>
                    <li>• PostgreSQL for metadata</li>
                    <li>• Redis for caching</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Code className="h-4 w-4 text-primary" />
                    Frontend
                  </h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Next.js 16 with App Router</li>
                    <li>• React 19</li>
                    <li>• TypeScript 5</li>
                    <li>• Tailwind CSS 4</li>
                    <li>• shadcn/ui components</li>
                    <li>• Vitest for testing</li>
                  </ul>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Quick Start:</strong> All documentation files are in the <code className="bg-muted px-2 py-1 rounded">docs/</code> folder.
                  Start with <code className="bg-muted px-2 py-1 rounded">APPLICATION.md</code> for architecture overview.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/help/developer#widgets">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Build Custom Widgets</CardTitle>
                  <CardDescription>
                    Create and upload your own dashboard widgets
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/help/developer#api">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                    <Terminal className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">API Reference</CardTitle>
                  <CardDescription>
                    Explore REST APIs and integration options
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/help/developer#guides">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">How-To Guides</CardTitle>
                  <CardDescription>
                    Step-by-step tutorials and examples
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </TabsContent>

        {/* Custom Widgets Tab */}
        <TabsContent value="widgets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Widget Development</CardTitle>
              <CardDescription>
                Build, package, and deploy custom dashboard widgets using our Widget SDK
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Getting Started (10 minutes)
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">1</Badge>
                    <div>
                      <strong>Install Widget SDK</strong>
                      <code className="block bg-muted p-2 rounded mt-1">npm install @sensormine/widget-sdk react@19 react-dom@19</code>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">2</Badge>
                    <div>
                      <strong>Create Widget Class</strong>
                      <pre className="bg-muted p-3 rounded mt-1 overflow-x-auto text-xs">
{`import { WidgetBase } from '@sensormine/widget-sdk';

export default class MyWidget extends WidgetBase {
  render() {
    return <div>Hello World</div>;
  }
}`}
                      </pre>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">3</Badge>
                    <div>
                      <strong>Create Manifest</strong>
                      <pre className="bg-muted p-3 rounded mt-1 overflow-x-auto text-xs">
{`{
  "id": "com.yourcompany.widget",
  "name": "My Widget",
  "version": "1.0.0",
  "permissions": { "apis": ["api.query"] }
}`}
                      </pre>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">4</Badge>
                    <div>
                      <strong>Build & Package</strong>
                      <code className="block bg-muted p-2 rounded mt-1">npm run build && cd dist && zip -r ../widget.zip *</code>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">5</Badge>
                    <div>
                      <strong>Upload to Platform</strong>
                      <p className="text-muted-foreground mt-1">Go to <Link href="/widgets/upload" className="text-primary underline">Widget Gallery → Upload</Link></p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">Widget SDK API</h3>
                <div className="space-y-3 text-sm">
                  <div className="bg-muted p-3 rounded">
                    <code className="font-mono">queryTelemetry(request)</code>
                    <p className="text-muted-foreground mt-1">Query time-series telemetry data with aggregations</p>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <code className="font-mono">getDevice(deviceId)</code>
                    <p className="text-muted-foreground mt-1">Get device details including metadata and configuration</p>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <code className="font-mono">listDevices(filter)</code>
                    <p className="text-muted-foreground mt-1">List devices with optional type and status filters</p>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <code className="font-mono">subscribeTelemetry(deviceIds, callback)</code>
                    <p className="text-muted-foreground mt-1">Subscribe to real-time telemetry updates</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/widgets/upload">
                    <Package className="mr-2 h-4 w-4" />
                    Upload Widget
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://github.com/sensormine/widget-examples" target="_blank" rel="noopener">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Examples
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Reference Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>REST API Reference</CardTitle>
              <CardDescription>
                All backend services expose OpenAPI/Swagger documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { name: 'Device API', port: 5293, desc: 'Device lifecycle management' },
                  { name: 'Query API', port: 5079, desc: 'Time-series data queries' },
                  { name: 'Schema Registry', port: 5021, desc: 'Schema management' },
                  { name: 'DigitalTwin API', port: 5297, desc: 'Asset hierarchy' },
                  { name: 'Dashboard API', port: 5299, desc: 'Dashboard configuration' },
                  { name: 'Alerts API', port: 5295, desc: 'Alert rules and instances' },
                  { name: 'Identity API', port: 5294, desc: 'User management' },
                  { name: 'Template API', port: 5296, desc: 'Custom widgets' },
                ].map((api) => (
                  <Card key={api.port} className="hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{api.name}</CardTitle>
                      <CardDescription className="text-xs">{api.desc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" variant="outline" asChild className="w-full">
                        <a href={`http://localhost:${api.port}/swagger`} target="_blank" rel="noopener">
                          <ExternalLink className="mr-2 h-3 w-3" />
                          Open Swagger UI
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* How-To Guides Tab */}
        <TabsContent value="guides" className="space-y-4">
          <div className="grid gap-4">
            {[
              {
                title: 'Create a Device Type',
                desc: 'Define device templates with schemas and field mappings',
                link: '/settings/device-types/create',
              },
              {
                title: 'Query Telemetry Data',
                desc: 'Use Query API to retrieve time-series data with aggregations',
                link: '/help/developer#api',
              },
              {
                title: 'Build an Asset Hierarchy',
                desc: 'Create digital twin structure with parent-child relationships',
                link: '/settings/digital-twin',
              },
              {
                title: 'Configure Alert Rules',
                desc: 'Set up threshold-based alerts with notifications',
                link: '/settings/alert-rules',
              },
              {
                title: 'Customize Dashboard Widgets',
                desc: 'Upload custom widgets with iframe isolation',
                link: '/widgets/upload',
              },
              {
                title: 'Manage User Permissions',
                desc: 'Configure role-based access control',
                link: '/settings/users',
              },
            ].map((guide, idx) => (
              <Link key={idx} href={guide.link}>
                <Card className="hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {idx + 1}
                      </Badge>
                      {guide.title}
                    </CardTitle>
                    <CardDescription>{guide.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* Troubleshooting Tab */}
        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  issue: 'Widget not loading',
                  solutions: [
                    'Check widget ID in browser console',
                    'Verify widget exists: GET /api/widgets/{id}',
                    'Check MinIO storage path',
                    'Verify widget package is valid ZIP',
                  ],
                },
                {
                  issue: 'API calls return 403/404',
                  solutions: [
                    'Check widget permissions in manifest.json',
                    'Verify X-Tenant-Id header is set',
                    'Check CORS configuration',
                    'Ensure backend services are running',
                  ],
                },
                {
                  issue: 'Database connection failed',
                  solutions: [
                    'Verify TimescaleDB container is running: docker ps',
                    'Check connection string uses port 5452',
                    'Test connection: Test-NetConnection localhost -Port 5452',
                    'Check logs: docker logs sensormine-timescaledb',
                  ],
                },
                {
                  issue: 'Frontend not loading',
                  solutions: [
                    'Check Node.js version (18+)',
                    'Run: npm install',
                    'Clear .next cache: rm -rf .next',
                    'Check port 3020 is not in use',
                  ],
                },
              ].map((item, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">❌ {item.issue}</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {item.solutions.map((solution, sidx) => (
                      <li key={sidx}>✓ {solution}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation Files</CardTitle>
          <CardDescription>
            Comprehensive guides in the <code className="bg-muted px-2 py-1 rounded">docs/</code> folder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {[
              { file: 'APPLICATION.md', desc: 'Microservices architecture' },
              { file: 'DATABASE.md', desc: 'Database schema and queries' },
              { file: 'INFRASTRUCTURE.md', desc: 'Container and deployment' },
              { file: 'LOCAL-DEVELOPMENT.md', desc: 'Development environment setup' },
              { file: 'custom-widget-system-complete.md', desc: 'Complete widget system guide' },
              { file: 'custom-widget-quick-start.md', desc: '10-minute widget tutorial' },
            ].map((doc) => (
              <div key={doc.file} className="flex items-center gap-2 text-sm">
                <FileCode className="h-4 w-4 text-primary" />
                <span className="font-mono">{doc.file}</span>
                <span className="text-muted-foreground">- {doc.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
