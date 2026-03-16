/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { firestoreService, ProductListing } from "@/lib/firestore-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const EsimCategoryProducts = () => {
  const { category } = useParams();
  const [items, setItems] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const esimProducts = await firestoreService.getProductListings('esim');
        const filtered = (esimProducts || []).filter((p: any) => p.subcategory === decodeURIComponent(category || ''));
        if (mounted) setItems(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [category]);

  const categoryName = decodeURIComponent(category || '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{categoryName} eSIM Plans</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our collection of {categoryName.toLowerCase()} eSIM data plans for seamless connectivity.
          </p>
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
            {items.map((p) => (
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
                    eSIM
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
      </main>
      <Footer />
    </div>
  );
};

export default EsimCategoryProducts;
