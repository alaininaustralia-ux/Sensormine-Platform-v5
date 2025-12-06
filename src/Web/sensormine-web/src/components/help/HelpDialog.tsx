/**
 * Help Dialog Component
 * 
 * Displays comprehensive help documentation with search and navigation
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  Rocket
} from 'lucide-react';
import { helpSections, searchHelpContent, getHelpArticle, getRelatedArticles, type HelpSection, type HelpArticle } from '@/lib/help/help-content';
import ReactMarkdown from 'react-markdown';

interface HelpDialogProps {
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

export function HelpDialog({ open, onOpenChange, initialArticleId }: HelpDialogProps) {
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

  const currentSection = selectedSection 
    ? helpSections.find(s => s.id === selectedSection) 
    : null;

  const relatedArticles = selectedArticle 
    ? getRelatedArticles(selectedArticle.id) 
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
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
              <DialogTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-[#0066CC]" />
                {selectedArticle ? selectedArticle.title : 'Help & Documentation'}
              </DialogTitle>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <ScrollArea className="flex-1 px-6 py-4">
            {/* Home View - Sections Grid */}
            {!selectedSection && !selectedArticle && searchResults.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {helpSections.map((section) => {
                  const Icon = section.icon ? iconMap[section.icon] : BookOpen;
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className="flex flex-col items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 rounded-md bg-[#0066CC]/10">
                          <Icon className="h-5 w-5 text-[#0066CC]" />
                        </div>
                        <h3 className="font-semibold flex-1">{section.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {section.content.length} article{section.content.length !== 1 ? 's' : ''}
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
                      <h3 className="font-semibold text-lg">{article.title}</h3>
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
                  <h2 className="text-2xl font-bold mb-2">Search Results</h2>
                  <p className="text-muted-foreground">
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
                      <h3 className="font-semibold text-lg">{article.title}</h3>
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

            {/* Article View */}
            {selectedArticle && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-3">{selectedArticle.title}</h1>
                  <p className="text-lg text-muted-foreground mb-4">{selectedArticle.summary}</p>
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
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                      code: ({node, inline, ...props}: any) => inline ? (
                        <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props} />
                      ) : (
                        <code className="block p-3 rounded-lg bg-muted text-sm font-mono overflow-x-auto mb-3" {...props} />
                      ),
                      pre: ({node, ...props}) => <pre className="mb-3" {...props} />,
                      a: ({node, ...props}) => (
                        <a 
                          className="text-[#0066CC] hover:underline inline-flex items-center gap-1" 
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
                    <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {relatedArticles.map(article => (
                        <button
                          key={article.id}
                          onClick={() => handleArticleClick(article)}
                          className="flex flex-col items-start gap-1 p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                        >
                          <h4 className="font-medium text-sm">{article.title}</h4>
                          <p className="text-xs text-muted-foreground">{article.summary}</p>
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
                <p className="text-muted-foreground">
                  Try different keywords or browse by category
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
