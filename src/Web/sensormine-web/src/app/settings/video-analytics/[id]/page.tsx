/**
 * Edit Video Analytics Configuration Page
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';
import { VideoAnalyticsForm } from '@/components/video-analytics/VideoAnalyticsForm';
import { videoAnalyticsApi } from '@/lib/api/videoAnalytics';
import type { VideoAnalyticsConfiguration } from '@/lib/types/video-analytics';
import { useToast } from '@/hooks/use-toast';

export default function EditVideoAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [configuration, setConfiguration] = useState<VideoAnalyticsConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        const id = params.id as string;
        const config = await videoAnalyticsApi.get(id);
        setConfiguration(config);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load configuration',
          variant: 'destructive',
        });
        router.push('/settings/video-analytics');
      } finally {
        setLoading(false);
      }
    };

    void loadConfiguration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-16">
          <Activity className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!configuration) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Video Analytics Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Update video source and processing model settings
        </p>
      </div>

      <VideoAnalyticsForm configuration={configuration} />
    </div>
  );
}
