/**
 * Settings Page
 * 
 * Main settings landing page
 */

import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Database, Users, Shield, Bell, Palette } from 'lucide-react';

const settingsCategories = [
  {
    title: 'Device Types',
    description: 'Configure device type templates with protocols and schemas',
    icon: Cpu,
    href: '/settings/device-types',
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
  return (
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
  );
}
