import { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { globalSearchService, SearchResult, SearchCategory } from '../lib/global-search-service';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobileSearchProps {
  onClose: () => void;
}

export function MobileSearch({ onClose }: MobileSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Determine the base path (either /admin or /admin-panel)
  const basePath = location.pathname.startsWith('/admin-panel') ? '/admin-panel' : '/admin';

  // Auto-focus input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const searchData = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await globalSearchService.search(query);
        setResults(searchResults);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const allResults = results.flatMap(category => category.results);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allResults.length) {
          handleResultClick(allResults[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    const fullUrl = `${basePath}${result.url}`;
    navigate(fullUrl);
    onClose();
  };

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'page': return '📄';
      case 'user': return '👤';
      case 'order': return '📦';
      case 'gift_order': return '🎁';
      case 'product': return '🛍️';
      case 'gift': return '🎁';
      case 'transaction': return '💳';
      case 'custom_request': return '🎨';
      default: return result.icon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'page': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      case 'order': return 'bg-orange-100 text-orange-800';
      case 'gift_order': return 'bg-pink-100 text-pink-800';
      case 'product': return 'bg-purple-100 text-purple-800';
      case 'gift': return 'bg-red-100 text-red-800';
      case 'transaction': return 'bg-yellow-100 text-yellow-800';
      case 'custom_request': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          placeholder="Search pages, users, orders, tracking..."
          className="pl-10 pr-10 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {query && !loading && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => setQuery('')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Results */}
      <div className="min-h-[300px] max-h-[60vh]">
        {query.length < 2 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Start typing to search</p>
            <p className="text-sm">Search for pages, users, orders, and more</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Searching...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm">Try different keywords or check your spelling</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {results.map((category, categoryIndex) => (
                <div key={category.name}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
                    {category.name}
                  </h4>
                  <div className="space-y-1">
                    {category.results.map((result, resultIndex) => {
                      const globalIndex = results
                        .slice(0, categoryIndex)
                        .reduce((acc, cat) => acc + cat.results.length, 0) + resultIndex;
                      
                      return (
                        <div
                          key={result.id}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-colors border",
                            selectedIndex === globalIndex 
                              ? "bg-primary/10 border-primary/20" 
                              : "hover:bg-muted/50 border-transparent"
                          )}
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-lg mt-0.5 flex-shrink-0">
                              {getResultIcon(result)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-sm truncate">{result.title}</h5>
                                <Badge variant="secondary" className={cn("text-xs flex-shrink-0", getTypeColor(result.type))}>
                                  {result.type.replace('_', ' ')}
                                </Badge>
                              </div>
                              {result.subtitle && (
                                <p className="text-xs text-muted-foreground mb-1 truncate">{result.subtitle}</p>
                              )}
                              {result.description && (
                                <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Help Text */}
      {query.length >= 2 && results.length > 0 && (
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Use ↑↓ to navigate • Enter to select • Esc to close
          </p>
        </div>
      )}
    </div>
  );
}