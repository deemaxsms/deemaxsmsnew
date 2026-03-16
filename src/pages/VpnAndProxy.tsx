/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { firestoreService, ProductListing } from "@/lib/firestore-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const VpnAndProxy = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const vpn = await firestoreService.getProductListings('vpn');
        const proxy = await firestoreService.getProductListings('proxy');
        const allProducts = [...(vpn || []), ...(proxy || [])];

        // Group by provider and get unique providers
        const providerMap = new Map();
        allProducts.forEach(product => {
          if (!providerMap.has(product.provider)) {
            providerMap.set(product.provider, {
              name: product.provider,
              category: product.category,
              image: product.imageFilename ? `/assets/proxy-vpn/${product.imageFilename}` : undefined,
              productsCount: 0
            });
          }
          providerMap.get(product.provider).productsCount += 1;
        });

        const uniqueProviders = Array.from(providerMap.values());
        if (mounted) setProviders(uniqueProviders);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-12">
        <h1 className="text-2xl font-semibold mb-6">Vpn and Proxy</h1>

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
            {providers.map((provider) => (
              <Link key={provider.name} to={`/provider/${encodeURIComponent(provider.name)}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
                  <CardHeader className="p-0 relative">
                    <div className="h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                      {provider.image ? (
                        <img
                          src={provider.image}
                          alt={provider.name}
                          className="object-contain h-full w-full p-4 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-muted-foreground text-center p-4">
                          <div className="text-2xl mb-2">🔒</div>
                          <div className="text-sm">No image</div>
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={provider.category === 'vpn' ? 'default' : 'secondary'}
                      className="absolute top-3 left-3 text-xs font-medium"
                    >
                      {provider.category.toUpperCase()}
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{provider.name}</h3>
                    <div className="text-sm text-muted-foreground mb-3">
                      {provider.productsCount} product{provider.productsCount !== 1 ? 's' : ''} available
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default VpnAndProxy;
