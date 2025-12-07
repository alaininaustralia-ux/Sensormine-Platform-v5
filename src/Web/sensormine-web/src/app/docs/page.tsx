'use client';

import { useState } from 'react';
import { Search, ChevronRight, Book, Rocket, Settings, Database, Zap, Bell, Code, FileText } from 'lucide-react';
import { helpSections, type HelpSection, type HelpArticle } from '@/lib/help/help-content';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  rocket: Rocket,
  settings: Settings,
  database: Database,
  zap: Zap,
  bell: Bell,
  code: Code,
  book: Book,
  fileText: FileText,
};

export default function DocsPage() {
  const [selectedSection, setSelectedSection] = useState<HelpSection | null>(helpSections[0]);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(
    helpSections[0]?.content[0] || null
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = searchQuery
    ? helpSections.map(section => ({
        ...section,
        content: section.content.filter(
          article =>
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
      })).filter(section => section.content.length > 0)
    : helpSections;

  const handleArticleClick = (section: HelpSection, article: HelpArticle) => {
    setSelectedSection(section);
    setSelectedArticle(article);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Sections */}
      <div className="w-64 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Book className="h-6 w-6" />
            Documentation
          </h1>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSections.map((section) => {
            const Icon = section.icon ? iconMap[section.icon] || Book : Book;
            return (
              <div key={section.id} className="border-b border-border">
                <button
                  onClick={() => {
                    setSelectedSection(section);
                    if (section.content.length > 0) {
                      setSelectedArticle(section.content[0]);
                    }
                  }}
                  className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                    selectedSection?.id === section.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {section.content.length} {section.content.length === 1 ? 'article' : 'articles'}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Panel - Articles List */}
      {selectedSection && (
        <div className="w-80 border-r border-border flex flex-col bg-muted/20">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">{selectedSection.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{selectedSection.description}</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {selectedSection.content.map((article) => (
              <button
                key={article.id}
                onClick={() => handleArticleClick(selectedSection, article)}
                className={`w-full p-4 text-left border-b border-border hover:bg-accent transition-colors ${
                  selectedArticle?.id === article.id ? 'bg-accent border-l-2 border-l-primary' : ''
                }`}
              >
                <h4 className="font-medium text-sm text-foreground mb-1">{article.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content - Article */}
      <div className="flex-1 flex flex-col">
        {selectedArticle ? (
          <>
            <div className="p-6 border-b border-border">
              <h1 className="text-3xl font-bold text-foreground mb-2">{selectedArticle.title}</h1>
              <p className="text-muted-foreground">{selectedArticle.summary}</p>
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedArticle.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div
                  dangerouslySetInnerHTML={{
                    __html: selectedArticle.content
                      .replace(/\n/g, '<br />')
                      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
                      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-5 mb-2">$1</h2>')
                      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mt-4 mb-2">$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
                      .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">$1</code>')
                      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>'),
                  }}
                />
              </div>

              {/* Related Articles */}
              {selectedArticle.relatedArticles && selectedArticle.relatedArticles.length > 0 && (
                <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    Related Articles
                  </h3>
                  <div className="space-y-2">
                    {selectedArticle.relatedArticles.map((relatedId) => {
                      const related = helpSections
                        .flatMap((s) => s.content)
                        .find((a) => a.id === relatedId);
                      if (!related) return null;
                      return (
                        <button
                          key={relatedId}
                          onClick={() => {
                            const section = helpSections.find((s) =>
                              s.content.some((a) => a.id === relatedId)
                            );
                            if (section) {
                              handleArticleClick(section, related);
                            }
                          }}
                          className="block w-full text-left p-2 text-sm text-primary hover:bg-accent rounded transition-colors"
                        >
                          {related.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Book className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>Select an article to view its content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
