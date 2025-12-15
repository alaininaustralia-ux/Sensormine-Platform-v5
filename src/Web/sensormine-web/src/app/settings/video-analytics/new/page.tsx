/**
 * Create Video Analytics Configuration Page
 */

'use client';

import { VideoAnalyticsForm } from '@/components/video-analytics/VideoAnalyticsForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewVideoAnalyticsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Video Analytics Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure a video source and processing model
        </p>
      </div>

      <VideoAnalyticsForm />
    </div>
  );
}
