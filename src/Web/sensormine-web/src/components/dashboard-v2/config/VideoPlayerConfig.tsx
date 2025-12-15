'use client';

import { useState, useEffect } from 'react';
import type { Widget } from '@/lib/types/dashboard-v2';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Video, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoPlayerConfigProps {
  widget: Widget;
  onChange: (config: Partial<VideoPlayerConfig>) => void;
}

export interface VideoPlayerConfig {
  videoUrl?: string;
  deviceId?: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  muted?: boolean;
  videoType?: 'rtsp' | 'hls' | 'mp4' | 'webrtc' | 'http-stream';
  description?: string;
}

export function VideoPlayerConfig({ widget, onChange }: VideoPlayerConfigProps) {
  const config = {
    videoUrl: '',
    autoPlay: false,
    loop: false,
    controls: true,
    muted: false,
    videoType: 'mp4' as const,
    description: '',
    ...widget.config,
  } as VideoPlayerConfig;

  const [localVideoUrl, setLocalVideoUrl] = useState(config.videoUrl || '');
  const [isValidUrl, setIsValidUrl] = useState(true);

  useEffect(() => {
    // Validate URL format
    if (localVideoUrl) {
      try {
        new URL(localVideoUrl);
        setIsValidUrl(true);
      } catch {
        setIsValidUrl(false);
      }
    } else {
      setIsValidUrl(true);
    }
  }, [localVideoUrl]);

  const updateConfig = (updates: Partial<VideoPlayerConfig>) => {
    onChange(updates);
  };

  const handleVideoUrlBlur = () => {
    if (isValidUrl && localVideoUrl !== config.videoUrl) {
      updateConfig({ videoUrl: localVideoUrl });
    }
  };

  const handleVideoTypeChange = (type: VideoPlayerConfig['videoType']) => {
    updateConfig({ videoType: type });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Video className="h-4 w-4" />
        <span>Video Player Configuration</span>
      </div>

      {/* Video Source */}
      <div className="space-y-2">
        <Label htmlFor="videoUrl">Video Source URL</Label>
        <Input
          id="videoUrl"
          type="url"
          placeholder="https://example.com/video.mp4 or rtsp://camera-ip/stream"
          value={localVideoUrl}
          onChange={(e) => setLocalVideoUrl(e.target.value)}
          onBlur={handleVideoUrlBlur}
          className={!isValidUrl && localVideoUrl ? 'border-destructive' : ''}
        />
        {!isValidUrl && localVideoUrl && (
          <p className="text-xs text-destructive">Please enter a valid URL</p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter the URL of the video stream or file. Supports MP4, HLS, RTSP, WebRTC, and HTTP streams.
        </p>
      </div>

      {/* Video Type */}
      <div className="space-y-2">
        <Label htmlFor="videoType">Video Type</Label>
        <Select
          value={config.videoType}
          onValueChange={handleVideoTypeChange}
        >
          <SelectTrigger id="videoType">
            <SelectValue placeholder="Select video type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mp4">MP4 (Video File)</SelectItem>
            <SelectItem value="hls">HLS (HTTP Live Streaming)</SelectItem>
            <SelectItem value="rtsp">RTSP (Real-Time Streaming)</SelectItem>
            <SelectItem value="webrtc">WebRTC (Real-Time Communication)</SelectItem>
            <SelectItem value="http-stream">HTTP Stream (MJPEG)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the type of video source for optimal playback
        </p>
      </div>

      {/* RTSP Notice */}
      {config.videoType === 'rtsp' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            RTSP streams require a media server (like WebRTC gateway) to convert to browser-compatible format. 
            Direct RTSP playback is not supported in browsers.
          </AlertDescription>
        </Alert>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          placeholder="e.g., Front entrance camera"
          value={config.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Add a description to help identify this video source
        </p>
      </div>

      {/* Playback Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Playback Settings</h4>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="autoPlay">Auto Play</Label>
            <p className="text-xs text-muted-foreground">Start playing automatically when dashboard loads</p>
          </div>
          <Switch
            id="autoPlay"
            checked={config.autoPlay}
            onCheckedChange={(checked) => updateConfig({ autoPlay: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="loop">Loop Video</Label>
            <p className="text-xs text-muted-foreground">Restart video when it ends</p>
          </div>
          <Switch
            id="loop"
            checked={config.loop}
            onCheckedChange={(checked) => updateConfig({ loop: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="controls">Show Controls</Label>
            <p className="text-xs text-muted-foreground">Display playback controls (recommended)</p>
          </div>
          <Switch
            id="controls"
            checked={config.controls}
            onCheckedChange={(checked) => updateConfig({ controls: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="muted">Muted by Default</Label>
            <p className="text-xs text-muted-foreground">Start with audio muted</p>
          </div>
          <Switch
            id="muted"
            checked={config.muted}
            onCheckedChange={(checked) => updateConfig({ muted: checked })}
          />
        </div>
      </div>

      {/* Preview */}
      {config.videoUrl && isValidUrl && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="border rounded-lg overflow-hidden bg-black aspect-video">
            <video
              src={config.videoUrl}
              controls
              muted
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs space-y-1">
          <p className="font-medium">Video Source Tips:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>For IP cameras, use RTSP URLs (requires media gateway)</li>
            <li>For cloud storage, use direct MP4/HLS URLs</li>
            <li>For Azure Blob videos, enable anonymous read access</li>
            <li>Test playback before adding to production dashboards</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
