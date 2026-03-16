/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { firestoreService, ProductListing } from '@/lib/firestore-service';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const allProducts = await firestoreService.getProductListings();
        if (mounted && allProducts.length > 0) {
          // Shuffle and take 4 random products
          const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
          setProducts(shuffled.slice(0, 4));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="py-16">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold">Featured Products</h2>
            <p className="text-sm text-muted-foreground">Discover our top products and services.</p>
          </div>
          <div>
            <Button variant="outline" asChild>
              <Link to="/marketplace">View More</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
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
            {products.map((p) => (
              <Card key={p.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                <CardHeader className="p-0 relative">
                  <Link to={`/product/${p.slug}`}>
                    <div className="h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                      <img
                        src={p.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop'}
                        alt={p.name}
                        className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                  <Badge
                    variant="default"
                    className="absolute top-3 left-3 text-xs font-medium"
                  >
                    {p.category.toUpperCase()}
                  </Badge>
                  {p.outOfStock && (
                    <Badge variant="destructive" className="absolute top-3 right-3 text-xs">
                      Out of Stock
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">{p.provider}</div>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{p.name}</h3>
                  <div className="text-sm text-muted-foreground mb-3">{p.validity} • {p.dataAmount}</div>
                  {p.features && p.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {p.features.slice(0, 2).map((feature: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {p.features.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{p.features.length - 2} more
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xl text-primary">
                      ${Number(p.price).toFixed(2)}
                    </div>
                    {p.outOfStock ? (
                      <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Out of stock</div>
                    ) : p.link ? (
                      <a href={p.link} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Visit</a>
                    ) : (
                      <Link to={`/product/${p.slug}`} className="text-sm text-primary underline">Request</Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductList;
