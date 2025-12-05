/**
 * Schema Basic Info Component
 * 
 * First step of schema wizard - basic information
 * Story 2.2 - Schema Definition Frontend
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';

interface SchemaBasicInfoProps {
  data: {
    name: string;
    description: string;
    tags: string[];
  };
  onChange: (data: Partial<SchemaBasicInfoProps['data']>) => void;
}

export function SchemaBasicInfo({ data, onChange }: SchemaBasicInfoProps) {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !data.tags.includes(tag)) {
      onChange({ tags: [...data.tags, tag] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({ tags: data.tags.filter((tag) => tag !== tagToRemove) });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Schema Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="e.g., Temperature Sensor Schema"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">
          A unique, descriptive name for your schema
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe what this schema is for and what data it represents..."
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={4}
          required
        />
        <p className="text-sm text-muted-foreground">
          Provide details about the purpose and usage of this schema
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Add a tag (press Enter)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button type="button" variant="secondary" onClick={handleAddTag}>
            Add
          </Button>
        </div>
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Add tags to help categorize and search for this schema
        </p>
      </div>

      {/* Example Schemas */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
        <h3 className="font-medium">💡 Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Use descriptive names that clearly identify the data type</li>
          <li>Include details about the sensor type, measurement units, and data structure</li>
          <li>Add tags like &quot;temperature&quot;, &quot;sensor&quot;, &quot;iot&quot;, &quot;industrial&quot;</li>
        </ul>
      </div>
    </div>
  );
}
