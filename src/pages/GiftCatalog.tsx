import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { giftService, Gift, GiftCategory } from "@/lib/gift-service";
import { Search, Filter, Heart, Package, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const GiftCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [categories, setCategories] = useState<GiftCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortGifts();
  }, [searchTerm, selectedCategory, sortBy]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🎁 Loading gift catalog...');
      const [giftsData, categoriesData] = await Promise.all([
        giftService.getGifts(),
        giftService.getGiftCategories()
      ]);
      
      setGifts(giftsData);
      setCategories(categoriesData);
      console.log(`✅ Loaded ${giftsData.length} gifts and ${categoriesData.length} categories`);
    } catch (error) {
      console.error('❌ Error loading gift catalog:', error);
      setError('Failed to load gift catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortGifts = async () => {
    try {
      let filteredGifts = [...gifts];

      // Filter by search term
      if (searchTerm) {
        console.log(`🔍 Searching for: "${searchTerm}"`);
        filteredGifts = await giftService.searchGifts(
          searchTerm, 
          selectedCategory !== 'all' ? selectedCategory : undefined
        );
      } else if (selectedCategory !== 'all') {
        console.log(`📂 Filtering by category: ${selectedCategory}`);
        filteredGifts = await giftService.getGifts(selectedCategory);
      }

      // Sort gifts
      switch (sortBy) {
        case 'price-low':
          filteredGifts.sort((a, b) => a.basePrice - b.basePrice);
          break;
        case 'price-high':
          filteredGifts.sort((a, b) => b.basePrice - a.basePrice);
          break;
        case 'name':
          filteredGifts.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'newest':
        default:
          filteredGifts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }

      setGifts(filteredGifts);

      // Update URL params
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (sortBy !== 'newest') params.set('sort', sortBy);
      setSearchParams(params);
      
      console.log(`✅ Filtered to ${filteredGifts.length} gifts`);
    } catch (error) {
      console.error('❌ Error filtering gifts:', error);
      setError('Failed to filter gifts. Please try again.');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterAndSortGifts();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">🎁 Gift Catalog</h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Send beautiful gifts to your loved ones anywhere in the world. 
              Real gifts, real delivery, real joy.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-card rounded-lg border p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for gifts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="submit" className="md:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </form>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 -mx-2 px-2 overflow-x-auto">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Gifts
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.icon} {category.name}
              </Button>
            ))}
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {gifts.length} gift{gifts.length !== 1 ? 's' : ''} found
                {searchTerm && ` for "${searchTerm}"`}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/custom-gift-request">
                  <Package className="h-4 w-4 mr-2" />
                  Can't find what you're looking for?
                </Link>
              </Button>
            </div>
          )}

          {/* Gift Grid */}
          {error ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2 text-red-600">Error Loading Gifts</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="space-x-4">
                <Button onClick={loadData}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => {
                  setError(null);
                  setSearchTerm('');
                  setSelectedCategory('all');
                  loadData();
                }}>
                  Reset & Retry
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="p-0">
                    <Skeleton className="h-48 w-full" />
                  </CardHeader>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-full mb-3" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : gifts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No gifts found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? `No gifts match your search for "${searchTerm}"`
                  : "No gifts available in this category"
                }
              </p>
              <div className="space-x-4">
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  filterAndSortGifts();
                }}>
                  Clear Filters
                </Button>
                <Button asChild>
                  <Link to="/custom-gift-request">Request Custom Gift</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {gifts.map((gift) => (
                <Card key={gift.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                  <CardHeader className="p-0 relative">
                    <Link to={`/gift/${gift.slug}`}>
                      <div className="h-40 sm:h-44 md:h-48 lg:h-56 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                        <img
                          src={gift.images[0] || '/placeholder.png'}
                          alt={gift.title}
                          className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3">
                      {gift.isFragile && (
                        <Badge variant="secondary" className="text-xs mb-1 block">
                          Fragile
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs bg-white/90">
                        {gift.sizeClass}
                      </Badge>
                    </div>

                    {/* Wishlist Button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-3 right-3 bg-white/90 hover:bg-white"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2 mb-1">
                        <Link to={`/gift/${gift.slug}`} className="hover:text-primary">
                          {gift.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {gift.description}
                      </p>
                    </div>

                    {/* Tags */}
                    {gift.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {gift.tags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {gift.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{gift.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Delivery Info */}
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      <Truck className="h-3 w-3" />
                      <span>{gift.handlingTimeDays} day handling</span>
                      <span>•</span>
                      <span>{gift.weight}kg</span>
                    </div>

                    {/* Price and Action */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-lg text-primary">
                          {formatCurrency(gift.basePrice, 'USD')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          + shipping
                        </div>
                      </div>
                      <Button size="sm" asChild className="w-full sm:w-auto">
                        <Link to={`/gift/${gift.slug}`}>
                          Send Gift
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {!loading && gifts.length > 0 && gifts.length % 12 === 0 && (
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                Load More Gifts
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GiftCatalog;