/**
 * Settings Page
 * 
 * Main settings landing page with bookmarks and recently visited pages
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Cpu, Database, Users, Shield, Bell, Palette, Settings2, Network,
  Bookmark, Clock, Star, Trash2, ExternalLink 
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getBookmarks, getPageHistory, removeBookmark } from '@/lib/services/navigation-tracking';
import type { BookmarkItem, PageVisit } from '@/lib/types/preferences';
import { formatDistanceToNow } from 'date-fns';

const settingsCategories = [
  {
    title: 'Device Types',
    description: 'Configure device type templates with protocols and schemas',
    icon: Cpu,
    href: '/settings/device-types',
  },
  {
    title: 'Nexus Configuration',
    description: 'AI-powered configuration builder for Nexus IoT devices',
    icon: Settings2,
    href: '/settings/nexus-configuration',
  },
  {
    title: 'Digital Twin',
    description: 'Manage asset hierarchy and device-to-asset mappings',
    icon: Network,
    href: '/settings/digital-twin',
  },
  {
    title: 'Schemas',
    description: 'Manage data schemas and validation rules',
    icon: Database,
    href: '/settings/schemas',
  },
  {
    title: 'Users & Permissions',
    description: 'Manage user accounts and access control',
    icon: Users,
    href: '/settings/users',
  },
  {
    title: 'Security',
    description: 'Configure authentication and security policies',
    icon: Shield,
    href: '/settings/security',
  },
  {
    title: 'Notifications',
    description: 'Set up notification channels and alert routing',
    icon: Bell,
    href: '/settings/notifications',
  },
  {
    title: 'Appearance',
    description: 'Customize dashboard themes and layouts',
    icon: Palette,
    href: '/settings/appearance',
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [recentPages, setRecentPages] = useState<PageVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      try {
        setLoading(true);
        const [bookmarksData, historyData] = await Promise.all([
          getBookmarks(user.id),
          getPageHistory(user.id, undefined, 10),
        ]);
        setBookmarks(bookmarksData);
        setRecentPages(historyData);
      } catch (error) {
        console.error('Error loading navigation data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user]);

  async function handleRemoveBookmark(bookmarkId: string) {
    if (!user) return;
    
    const success = await removeBookmark(user.id, bookmarkId);
    if (success) {
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    }
  }

  return (
    <div className="space-y-6">
      {/* Bookmarks Section */}
      {!loading && bookmarks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl font-bold">Bookmarks</h2>
            <Badge variant="secondary">{bookmarks.length}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="group relative hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Link href={bookmark.path} className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{bookmark.title}</CardTitle>
                      </div>
                      <CardDescription className="text-xs truncate">
                        {bookmark.path}
                      </CardDescription>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveBookmark(bookmark.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {bookmark.category && (
                    <Badge variant="outline" className="text-xs w-fit">
                      {bookmark.category}
                    </Badge>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
          <Separator className="my-6" />
        </div>
      )}

      {/* Recently Visited Section */}
      {!loading && recentPages.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Recently Visited</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {recentPages.map((page, index) => (
              <Link key={`${page.path}-${index}`} href={page.path}>
                <Card className="hover:shadow-md transition-all hover:border-primary/30">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{page.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{page.path}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(page.visitedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Separator className="my-6" />
        </div>
      )}

      {/* Settings Categories */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Settings</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.href} href={category.href}>
                <Card className="transition-all hover:shadow-lg hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle>{category.title}</CardTitle>
                    </div>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
