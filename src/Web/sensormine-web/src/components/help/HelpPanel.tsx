/**
 * Help Panel Component
 * 
 * Slide-out side panel with comprehensive help documentation
 * Can be popped out into a separate window
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  BookOpen, 
  ArrowLeft,
  ExternalLink,
  Cpu,
  Monitor,
  FileJson,
  Network,
  LayoutDashboard,
  Bell,
  Code,
  Wrench,
  Rocket,
  X,
  Maximize2
} from 'lucide-react';
import { helpSections, searchHelpContent, getHelpArticle, getRelatedArticles, type HelpArticle } from '@/lib/help/help-content';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialArticleId?: string;
}

const iconMap: Record<string, any> = {
  'rocket': Rocket,
  'cpu': Cpu,
  'monitor': Monitor,
  'file-json': FileJson,
  'network': Network,
  'layout-dashboard': LayoutDashboard,
  'bell': Bell,
  'code': Code,
  'wrench': Wrench,
};

export function HelpPanel({ open, onOpenChange, initialArticleId }: HelpPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(
    initialArticleId ? getHelpArticle(initialArticleId) : null
  );
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchHelpContent(query);
      setSearchResults(results);
      setSelectedSection(null);
      setSelectedArticle(null);
    } else {
      setSearchResults([]);
    }
  };

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId);
    setSelectedArticle(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (selectedSection) {
      setSelectedSection(null);
    }
  };

  const handlePopOut = () => {
    const content = selectedArticle 
      ? `
        <html>
          <head>
            <title>${selectedArticle.title} - Sensormine Help</title>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                padding: 2rem; 
                max-width: 900px; 
                margin: 0 auto;
                line-height: 1.6;
              }
              h1 { color: #0066CC; margin-bottom: 0.5rem; }
              h2 { margin-top: 2rem; margin-bottom: 1rem; }
              h3 { margin-top: 1.5rem; margin-bottom: 0.75rem; }
              p { margin-bottom: 1rem; }
              pre { 
                background: #f5f5f5; 
                padding: 1rem; 
                border-radius: 0.5rem; 
                overflow-x: auto;
                margin-bottom: 1rem;
              }
              code { 
                background: #f5f5f5; 
                padding: 0.125rem 0.375rem; 
                border-radius: 0.25rem;
                font-family: 'Courier New', monospace;
              }
              ul, ol { margin-bottom: 1rem; padding-left: 2rem; }
              li { margin-bottom: 0.5rem; }
            </style>
          </head>
          <body>
            <h1>${selectedArticle.title}</h1>
            <p style="color: #666; font-size: 1.125rem;">${selectedArticle.summary}</p>
            ${selectedArticle.content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
              .replace(/`([^`]+)`/g, '<code>$1</code>')
              .replace(/^### (.+)$/gm, '<h3>$1</h3>')
              .replace(/^## (.+)$/gm, '<h2>$1</h2>')
              .replace(/^# (.+)$/gm, '<h1>$1</h1>')
              .replace(/\n\n/g, '</p><p>')
              .replace(/^(?!<[h|p|pre])/gm, '<p>')
              .replace(/(?<!>)$/gm, '</p>')}
          </body>
        </html>
      `
      : `
        <html>
          <head>
            <title>Sensormine Help</title>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                padding: 2rem;
              }
            </style>
          </head>
          <body>
            <h1>Sensormine Platform Help</h1>
            <p>Select a topic from the help panel.</p>
          </body>
        </html>
      `;

    const newWindow = window.open('', '_blank', 'width=900,height=700');
    if (newWindow) {
      newWindow.document.write(content);
      newWindow.document.close();
    }
  };

  const currentSection = selectedSection 
    ? helpSections.find(s => s.id === selectedSection) 
    : null;

  const relatedArticles = selectedArticle 
    ? getRelatedArticles(selectedArticle.id) 
    : [];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Side Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-[600px] border-l shadow-2xl z-50 transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ backgroundColor: '#ffffff', opacity: 1 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#f8fafc' }}>
          <div className="flex items-center gap-3">
            {(selectedSection || selectedArticle || searchResults.length > 0) && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#0066CC]" />
              <h2 className="text-lg font-semibold">
                {selectedArticle ? selectedArticle.title : 'Help & Documentation'}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePopOut}
              className="h-8 w-8"
              title="Pop out to new window"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b" style={{ backgroundColor: '#f9fafb' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="px-6 py-4">
            {/* Home View - Sections Grid */}
            {!selectedSection && !selectedArticle && searchResults.length === 0 && (
              <div className="space-y-3">
                {helpSections.map((section) => {
                  const Icon = section.icon ? iconMap[section.icon] : BookOpen;
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className="w-full flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                    >
                      <div className="p-2 rounded-md bg-[#0066CC]/10 shrink-0">
                        <Icon className="h-5 w-5 text-[#0066CC]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">{section.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {section.description}
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {section.content.length} article{section.content.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Section View - Articles List */}
            {currentSection && !selectedArticle && searchResults.length === 0 && (
              <div className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">{currentSection.title}</h2>
                  <p className="text-muted-foreground">{currentSection.description}</p>
                </div>
                
                <div className="space-y-3">
                  {currentSection.content.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleArticleClick(article)}
                      className="w-full flex flex-col items-start gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                    >
                      <h3 className="font-semibold">{article.title}</h3>
                      <p className="text-sm text-muted-foreground">{article.summary}</p>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {article.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-2">Search Results</h2>
                  <p className="text-sm text-muted-foreground">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                </div>
                
                <div className="space-y-3">
                  {searchResults.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => {
                        handleArticleClick(article);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full flex flex-col items-start gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                    >
                      <h3 className="font-semibold">{article.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {article.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Article View */}
            {selectedArticle && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-3">{selectedArticle.title}</h1>
                  <p className="text-base text-muted-foreground mb-4">{selectedArticle.summary}</p>
                  {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedArticle.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-6 mb-3" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-5 mb-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-4 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-sm" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 text-sm" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-sm" {...props} />,
                      code: ({node, inline, ...props}: any) => inline ? (
                        <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono" {...props} />
                      ) : (
                        <code className="block p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto mb-3" {...props} />
                      ),
                      pre: ({node, ...props}) => <pre className="mb-3" {...props} />,
                      a: ({node, ...props}) => (
                        <a 
                          className="text-[#0066CC] hover:underline inline-flex items-center gap-1 text-sm" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          {...props}
                        >
                          {props.children}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ),
                    }}
                  >
                    {selectedArticle.content}
                  </ReactMarkdown>
                </div>

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="text-base font-semibold mb-4">Related Articles</h3>
                    <div className="space-y-2">
                      {relatedArticles.map(article => (
                        <button
                          key={article.id}
                          onClick={() => handleArticleClick(article)}
                          className="w-full flex flex-col items-start gap-1 p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                        >
                          <h4 className="font-medium text-sm">{article.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {searchQuery && searchResults.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground text-sm">
                  Try different keywords or browse by category
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
