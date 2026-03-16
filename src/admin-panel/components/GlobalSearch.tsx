import { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { globalSearchService, SearchResult, SearchCategory } from '../lib/global-search-service';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchCategory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Determine the base path (either /admin or /admin-panel)
  const basePath = location.pathname.startsWith('/admin-panel') ? '/admin-panel' : '/admin';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchData = async () => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await globalSearchService.search(query);
        setResults(searchResults);
        setIsOpen(true);
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
    if (!isOpen || allResults.length === 0) return;

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
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    const fullUrl = `${basePath}${result.url}`;
    navigate(fullUrl);
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    if (query.length >= 2 && results.length > 0) {
      setIsOpen(true);
    }
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
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          placeholder="Search pages, users, orders, tracking... (Ctrl+K)"
          className="pl-10 w-80"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {results.map((category, categoryIndex) => (
              <div key={category.name}>
                <div className="px-4 py-2 bg-muted/50 border-b">
                  <h4 className="text-sm font-medium text-muted-foreground">{category.name}</h4>
                </div>
                {category.results.map((result, resultIndex) => {
                  const globalIndex = results
                    .slice(0, categoryIndex)
                    .reduce((acc, cat) => acc + cat.results.length, 0) + resultIndex;
                  
                  return (
                    <div
                      key={result.id}
                      className={cn(
                        "px-4 py-3 cursor-pointer border-b last:border-b-0 hover:bg-muted/50 transition-colors",
                        selectedIndex === globalIndex && "bg-muted"
                      )}
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-lg mt-0.5">{getResultIcon(result)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-sm truncate">{result.title}</h5>
                            <Badge variant="secondary" className={cn("text-xs", getTypeColor(result.type))}>
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
            ))}
            
            {query.length >= 2 && (
              <div className="px-4 py-2 bg-muted/30 border-t">
                <p className="text-xs text-muted-foreground">
                  Use ↑↓ to navigate, Enter to select, Esc to close
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}