'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { getBookmarks, getRecentPages } from "@/lib/bookmarks";
import { Bookmark, Clock, ArrowRight, LayoutDashboard, Cpu, Bell, LineChart, Settings, File } from "lucide-react";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Cpu,
  Bell,
  LineChart,
  Settings,
  File,
};

export default function Home() {
  const { isAuthenticated } = useAuth();

  // If authenticated, show personalized homepage
  if (isAuthenticated) {
    const bookmarks = getBookmarks();
    const recentPages = getRecentPages();

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground mt-2">
            Here&apos;s your personalized dashboard
          </p>
        </div>

        {/* Bookmarks Section */}
        {bookmarks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Bookmark className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-semibold">Bookmarks</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((bookmark) => {
                const Icon = bookmark.icon ? iconMap[bookmark.icon] || File : File;
                return (
                  <Link key={bookmark.id} href={bookmark.href}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <CardTitle className="text-base">{bookmark.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{bookmark.href}</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Pages Section */}
        {recentPages.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Recently Visited</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentPages.slice(0, 6).map((page) => {
                const Icon = page.icon ? iconMap[page.icon] || File : File;
                const visitedDate = new Date(page.visitedAt);
                const timeAgo = getTimeAgo(visitedDate);

                return (
                  <Link key={page.id} href={page.href}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <CardTitle className="text-base">{page.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{timeAgo}</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <LayoutDashboard className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Dashboard</CardTitle>
                  <CardDescription>View your dashboards</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/devices">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Cpu className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Devices</CardTitle>
                  <CardDescription>Manage your devices</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/alerts">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Bell className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Alerts</CardTitle>
                  <CardDescription>Check alert status</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/charts">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <LineChart className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Charts</CardTitle>
                  <CardDescription>Visualize data</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // Public landing page for non-authenticated users
  return (
    <div className="container py-12">
      <section className="flex flex-col items-center justify-center space-y-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Welcome to Sensormine Platform
        </h1>
        <p className="max-w-[600px] text-lg text-muted-foreground">
          Industrial IoT platform for real-time device monitoring, data visualization,
          and intelligent analytics.
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/docs">
            <Button size="lg" variant="outline">
              Documentation
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 py-12 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Real-Time Monitoring</CardTitle>
            <CardDescription>
              Monitor your devices and sensors in real-time with live dashboards
            </CardDescription>
          </CardHeader>
          <CardContent>
            Track device status, performance metrics, and sensor data with
            millisecond precision using our advanced time-series database.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visual Analytics</CardTitle>
            <CardDescription>
              Create custom dashboards with charts, maps, and 3D visualizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            Build interactive dashboards with time-series charts, GIS maps,
            gauge widgets, and advanced 3D CAD/LiDAR visualizations.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intelligent Alerts</CardTitle>
            <CardDescription>
              Set up custom alerts and receive notifications instantly
            </CardDescription>
          </CardHeader>
          <CardContent>
            Configure threshold-based and anomaly detection alerts with
            multi-channel notifications via email, SMS, and webhooks.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
