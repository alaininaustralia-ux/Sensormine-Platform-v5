import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
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
