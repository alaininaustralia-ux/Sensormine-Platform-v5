/**
 * Support Page
 * 
 * Comprehensive support resources and contact information
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, FileText, MessageCircle, Book, Video, Bug, HelpCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Support - Sensormine Platform',
  description: 'Get help and support for the Sensormine Platform',
};

export default function SupportPage() {
  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Support Center</h1>
        <p className="text-xl text-muted-foreground">
          Get help with the Sensormine Platform. We&apos;re here to assist you.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Mail className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg">Email Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Get help from our support team
            </p>
            <a href="mailto:support@sensormine.com" className="text-primary hover:underline text-sm font-medium">
              support@sensormine.com
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Book className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg">Documentation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse our comprehensive guides
            </p>
            <Link href="/docs" className="text-primary hover:underline text-sm font-medium">
              View Docs →
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Chat with support team
            </p>
            <Button size="sm" className="w-full">
              Start Chat
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bug className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg">Report Issue</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Report bugs or issues
            </p>
            <a href="https://github.com/sensormine/platform/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-medium">
              GitHub Issues →
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Support Resources */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Support Resources</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Getting Started */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Getting Started</CardTitle>
              </div>
              <CardDescription>Quick guides to help you get up and running</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/docs/quick-start" className="block text-sm hover:text-primary transition-colors">
                • Quick Start Guide
              </Link>
              <Link href="/docs/setup" className="block text-sm hover:text-primary transition-colors">
                • Initial Setup and Configuration
              </Link>
              <Link href="/docs/devices" className="block text-sm hover:text-primary transition-colors">
                • Adding Your First Device
              </Link>
              <Link href="/docs/dashboards" className="block text-sm hover:text-primary transition-colors">
                • Creating Custom Dashboards
              </Link>
            </CardContent>
          </Card>

          {/* User Guides */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Book className="h-5 w-5 text-primary" />
                <CardTitle>User Guides</CardTitle>
              </div>
              <CardDescription>In-depth documentation for all features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/docs/device-management" className="block text-sm hover:text-primary transition-colors">
                • Device Management
              </Link>
              <Link href="/docs/digital-twin" className="block text-sm hover:text-primary transition-colors">
                • Digital Twin & Asset Hierarchy
              </Link>
              <Link href="/docs/alerts" className="block text-sm hover:text-primary transition-colors">
                • Alert Rules & Notifications
              </Link>
              <Link href="/docs/query-api" className="block text-sm hover:text-primary transition-colors">
                • Querying Telemetry Data
              </Link>
            </CardContent>
          </Card>

          {/* API Documentation */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>API Documentation</CardTitle>
              </div>
              <CardDescription>REST API reference and integration guides</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/docs/api/authentication" className="block text-sm hover:text-primary transition-colors">
                • Authentication & Authorization
              </Link>
              <Link href="/docs/api/devices" className="block text-sm hover:text-primary transition-colors">
                • Device API Reference
              </Link>
              <Link href="/docs/api/query" className="block text-sm hover:text-primary transition-colors">
                • Query API Reference
              </Link>
              <Link href="/docs/api/webhooks" className="block text-sm hover:text-primary transition-colors">
                • Webhooks & Events
              </Link>
            </CardContent>
          </Card>

          {/* Video Tutorials */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Video className="h-5 w-5 text-primary" />
                <CardTitle>Video Tutorials</CardTitle>
              </div>
              <CardDescription>Step-by-step video guides</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="#" className="block text-sm hover:text-primary transition-colors">
                • Platform Overview (10 min)
              </a>
              <a href="#" className="block text-sm hover:text-primary transition-colors">
                • Device Setup Walkthrough (15 min)
              </a>
              <a href="#" className="block text-sm hover:text-primary transition-colors">
                • Building Custom Dashboards (20 min)
              </a>
              <a href="#" className="block text-sm hover:text-primary transition-colors">
                • Advanced Alert Configuration (12 min)
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-2">
                <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">How do I add a new device?</CardTitle>
                  <CardDescription className="mt-2">
                    Navigate to Devices → Add Device. Select your device type, enter the serial number and metadata, 
                    then configure the MQTT or HTTP connection settings. Once saved, your device will appear in the device list.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-2">
                <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">How do I query historical telemetry data?</CardTitle>
                  <CardDescription className="mt-2">
                    Use the Query API or the built-in dashboard widgets. You can query by device ID, time range, 
                    and specific fields. Aggregations (avg, min, max, sum) are supported with configurable time buckets.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-2">
                <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">What protocols are supported for device connectivity?</CardTitle>
                  <CardDescription className="mt-2">
                    The platform supports MQTT, HTTP/REST, WebSocket, Modbus TCP, and OPC UA. Each protocol 
                    has specific configuration requirements detailed in the Device Management documentation.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-2">
                <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">How long is telemetry data retained?</CardTitle>
                  <CardDescription className="mt-2">
                    By default, telemetry data is retained for 90 days in hot storage (TimescaleDB) and 2 years 
                    in cold storage (S3/object storage). Retention policies can be customized per tenant.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-2">
                <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">Can I export my data?</CardTitle>
                  <CardDescription className="mt-2">
                    Yes, you can export telemetry data via the Query API in JSON or CSV format. Device metadata 
                    can be exported from the Device Management interface. For bulk exports, contact support.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-2">
                <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">How do I set up alert notifications?</CardTitle>
                  <CardDescription className="mt-2">
                    Go to Alerts → Create Alert Rule. Define the condition (e.g., &quot;temperature &gt; 75&quot;), select 
                    the severity, and configure notification channels (email, SMS, webhook). The alert evaluation 
                    service runs every 30 seconds.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* System Status */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6">System Status</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                <div>
                  <p className="font-medium">All Systems Operational</p>
                  <p className="text-sm text-muted-foreground">Last updated: December 12, 2025 at 10:30 AM UTC</p>
                </div>
              </div>
              <a href="#" className="text-primary hover:underline text-sm font-medium">
                View Status Page →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Plans */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Support Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Community</CardTitle>
              <CardDescription className="text-2xl font-bold text-foreground">Free</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                <li>• Community forum access</li>
                <li>• Email support (48h response)</li>
                <li>• Documentation access</li>
                <li>• GitHub issue tracking</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center">
                Standard
                <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Popular</span>
              </CardTitle>
              <CardDescription className="text-2xl font-bold text-foreground">$99/mo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                <li>• All Community features</li>
                <li>• Email support (24h response)</li>
                <li>• Priority bug fixes</li>
                <li>• Video call support (monthly)</li>
              </ul>
              <Button className="w-full">Upgrade Now</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription className="text-2xl font-bold text-foreground">Custom</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                <li>• All Standard features</li>
                <li>• 24/7 phone support</li>
                <li>• Dedicated success manager</li>
                <li>• Custom SLA agreements</li>
                <li>• On-site training available</li>
              </ul>
              <Button variant="outline" className="w-full">Contact Sales</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Section */}
      <div>
        <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <h3 className="font-semibold mb-2">General Support</h3>
                <a href="mailto:support@sensormine.com" className="text-primary hover:underline">
                  support@sensormine.com
                </a>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Sales Inquiries</h3>
                <a href="mailto:sales@sensormine.com" className="text-primary hover:underline">
                  sales@sensormine.com
                </a>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Technical Support</h3>
                <a href="mailto:technical@sensormine.com" className="text-primary hover:underline">
                  technical@sensormine.com
                </a>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Billing Questions</h3>
                <a href="mailto:billing@sensormine.com" className="text-primary hover:underline">
                  billing@sensormine.com
                </a>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Partnership Opportunities</h3>
                <a href="mailto:partners@sensormine.com" className="text-primary hover:underline">
                  partners@sensormine.com
                </a>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Security Issues</h3>
                <a href="mailto:security@sensormine.com" className="text-primary hover:underline">
                  security@sensormine.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
