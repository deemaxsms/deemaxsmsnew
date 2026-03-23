/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { firestoreService } from "@/lib/firestore-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Helper to convert Imgur Album links to Direct Image links
const fixImgurLink = (url: string) => {
  if (!url) return "";
  let cleanUrl = url.trim();
  if (cleanUrl.includes("imgur.com/a/")) {
    return cleanUrl.replace("imgur.com/a/", "i.imgur.com/") + ".png";
  }
  if (cleanUrl.includes("imgur.com/") && !cleanUrl.includes("i.imgur.com")) {
    return cleanUrl.replace("imgur.com/", "i.imgur.com/") + ".png";
  }
  return cleanUrl;
};

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

        const providerMap = new Map();
        allProducts.forEach(product => {
          if (!providerMap.has(product.provider)) {
            // We pass the raw image URL into our fix helper here
            const rawImage = product.imageUrl || product.image || (product.imageFilename ? `/assets/proxy-vpn/${product.imageFilename}` : undefined);
            
            providerMap.set(product.provider, {
              name: product.provider,
              category: product.category,
              image: fixImgurLink(rawImage || ""),
              price: product.price,
              description: product.description,
              productsCount: 0
            });
          }
          providerMap.get(product.provider).productsCount += 1;
        });

        const uniqueProviders = Array.from(providerMap.values());
        if (mounted) setProviders(uniqueProviders);
      } catch (e) {
        console.error("Error fetching VPN/Proxy data:", e);
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
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-0">
                  <Skeleton className="h-48 w-full" />
                </CardHeader>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-3" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {providers.map((provider) => (
              <Link key={provider.name} to={`/provider/${encodeURIComponent(provider.name)}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border-muted">
                  <CardHeader className="p-0 relative">
                    <div className="h-48 bg-muted/30 flex items-center justify-center overflow-hidden">
                      {provider.image ? (
                        <img
                          src={provider.image}
                          alt={provider.name}
                          referrerPolicy="no-referrer"
                          className="object-contain h-full w-full p-6 group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                             (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Check+Image+Link";
                          }}
                        />
                      ) : (
                        <div className="text-muted-foreground text-center p-4">
                          <div className="text-3xl mb-2">🛡️</div>
                          <div className="text-xs font-medium">No Image Found</div>
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={provider.category === 'vpn' ? 'default' : 'secondary'}
                      className="absolute top-3 left-3 text-[10px] uppercase tracking-wider"
                    >
                      {provider.category}
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {provider.name}
                      </h3>
                      <span className="font-bold text-primary">
                        ${provider.price || '0.00'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                      {provider.description || "High-speed secure connection for all your devices."}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-muted/50">
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {provider.productsCount} Available
                      </span>
                      <span className="text-xs font-bold text-primary group-hover:underline">
                        Order Now →
                      </span>
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