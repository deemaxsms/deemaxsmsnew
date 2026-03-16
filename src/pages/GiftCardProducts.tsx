import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { firestoreService, ProductListing } from "@/lib/firestore-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Gift, ShoppingCart, Gamepad2, Music, Video, Smartphone, CreditCard } from "lucide-react";

const GiftCardProducts = () => {
  const { subcategory } = useParams();
  const [items, setItems] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(subcategory || 'all');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const giftProducts = await firestoreService.getProductListings('gift');
        let filtered = giftProducts || [];
        
        if (selectedSubcategory && selectedSubcategory !== 'all') {
          filtered = filtered.filter(p => p.subcategory === selectedSubcategory);
        }
        
        if (mounted) setItems(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedSubcategory]);

  const subcategories = [
    { id: 'all', name: 'All Gift Cards', icon: Gift },
    { id: 'digital', name: 'Digital Cards', icon: CreditCard },
    { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
    { id: 'entertainment', name: 'Entertainment', icon: Video }
  ];

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      'Amazon': 'bg-orange-500',
      'Google': 'bg-blue-500',
      'Apple': 'bg-gray-800',
      'Steam': 'bg-blue-900',
      'Netflix': 'bg-red-600',
      'Spotify': 'bg-green-500'
    };
    return colors[provider] || 'bg-primary';
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'steam': return Gamepad2;
      case 'spotify': return Music;
      case 'netflix': return Video;
      case 'google': return Smartphone;
      default: return ShoppingCart;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Digital Gift Cards</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Send digital gift cards instantly to friends and family. Perfect for gaming, shopping, entertainment, and more.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {subcategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.id}
                variant={selectedSubcategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedSubcategory(cat.id)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {cat.name}
              </Button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-0">
                  <Skeleton className="h-48 w-full" />
                </CardHeader>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-16 mb-3" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((product) => {
              const ProviderIcon = getProviderIcon(product.provider);
              const providerColor = getProviderColor(product.provider);
              
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                  <CardHeader className="p-0 relative">
                    <Link to={`/product/${product.slug}`}>
                      <div className={`h-48 ${providerColor} flex items-center justify-center overflow-hidden relative`}>
                        <div className="text-center p-4 text-white">
                          <ProviderIcon className="h-16 w-16 mx-auto mb-2" />
                          <p className="text-lg font-bold">{product.provider}</p>
                          <p className="text-sm opacity-90">Gift Card</p>
                          {product.giftValue && (
                            <div className="mt-2 bg-white/20 rounded-full px-3 py-1">
                              <span className="text-xl font-bold">${product.giftValue}</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                      </div>
                    </Link>
                    <Badge
                      variant="default"
                      className="absolute top-3 left-3 text-xs font-medium bg-purple-600"
                    >
                      GIFT CARD
                    </Badge>
                    {product.outOfStock && (
                      <Badge variant="destructive" className="absolute top-3 right-3 text-xs">
                        Out of Stock
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">{product.provider}</div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                    
                    {/* Gift Value */}
                    {product.giftValue && (
                      <div className="bg-muted/50 rounded-lg p-2 mb-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Gift Value</p>
                          <p className="text-lg font-bold text-primary">
                            ${product.giftValue} {product.giftCurrency || 'USD'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Delivery Method */}
                    {product.deliveryMethod && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Gift className="h-3 w-3" />
                        <span className="capitalize">{product.deliveryMethod} delivery</span>
                      </div>
                    )}

                    {product.features && product.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.features.slice(0, 2).map((feature: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {product.features.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.features.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xl text-primary">
                          ${Number(product.price).toFixed(2)}
                        </div>
                        {product.giftValue && product.price !== product.giftValue && (
                          <div className="text-xs text-muted-foreground">
                            +${(product.price - product.giftValue).toFixed(2)} fee
                          </div>
                        )}
                      </div>
                      {product.outOfStock ? (
                        <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Out of stock</div>
                      ) : (
                        <Link to={`/product/${product.slug}`} className="text-sm text-primary underline">Purchase</Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-12">
            <Gift className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Gift Cards Found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedSubcategory === 'all' 
                ? "We're currently updating our gift card offerings. Please check back soon!"
                : `No ${selectedSubcategory} gift cards available at the moment.`
              }
            </p>
            <Button variant="outline" onClick={() => setSelectedSubcategory('all')}>
              View All Categories
            </Button>
          </div>
        )}

        {/* Gift Card Info */}
        <div className="mt-16 bg-muted/50 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">How Digital Gift Cards Work</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">1. Purchase</h3>
              <p className="text-sm text-muted-foreground">
                Select your gift card and complete the purchase with your account balance.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">2. Receive Code</h3>
              <p className="text-sm text-muted-foreground">
                Get your digital gift card code instantly via email and in your order history.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">3. Redeem</h3>
              <p className="text-sm text-muted-foreground">
                Use the code on the respective platform or send it to someone special.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GiftCardProducts;