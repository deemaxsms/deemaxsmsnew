import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { firestoreService, ProductListing } from "@/lib/firestore-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Monitor, Cpu, HardDrive, MemoryStick, Wifi, Shield, Clock, Server } from "lucide-react";

const RDPProducts = () => {
  const { subcategory } = useParams();
  const [items, setItems] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(subcategory || 'all');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rdpProducts = await firestoreService.getProductListings('rdp');
        let filtered = rdpProducts || [];
        
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
    { id: 'all', name: 'All RDP', icon: Monitor },
    { id: 'windows', name: 'Windows', icon: Monitor },
    { id: 'linux', name: 'Linux', icon: Server },
    { id: 'server', name: 'Server', icon: Server }
  ];

  const getSpecIcon = (spec: string) => {
    if (spec.toLowerCase().includes('ram') || spec.toLowerCase().includes('memory')) return MemoryStick;
    if (spec.toLowerCase().includes('cpu') || spec.toLowerCase().includes('core')) return Cpu;
    if (spec.toLowerCase().includes('ssd') || spec.toLowerCase().includes('storage')) return HardDrive;
    if (spec.toLowerCase().includes('bandwidth') || spec.toLowerCase().includes('network')) return Wifi;
    return Shield;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Remote Desktop (RDP) Services</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access powerful remote desktops with Windows, Linux, and Server environments. Perfect for development, testing, and business applications.
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
            {items.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                <CardHeader className="p-0 relative">
                  <Link to={`/product/${product.slug}`}>
                    <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center overflow-hidden">
                      <div className="text-center p-4">
                        <Monitor className="h-16 w-16 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          {product.specifications?.os || 'Remote Desktop'}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Badge
                    variant="default"
                    className="absolute top-3 left-3 text-xs font-medium bg-blue-600"
                  >
                    RDP
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
                  
                  {/* Specifications */}
                  {product.specifications && (
                    <div className="space-y-1 mb-3">
                      {Object.entries(product.specifications).slice(0, 3).map(([key, value]) => {
                        const Icon = getSpecIcon(key);
                        return (
                          <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Icon className="h-3 w-3" />
                            <span className="capitalize">{key}:</span>
                            <span className="font-medium">{value as string}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {product.duration}
                  </div>

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
                    <div className="font-bold text-xl text-primary">
                      ${Number(product.price).toFixed(2)}
                    </div>
                    {product.outOfStock ? (
                      <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Out of stock</div>
                    ) : (
                      <Link to={`/product/${product.slug}`} className="text-sm text-primary underline">Request</Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-12">
            <Monitor className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No RDP Services Found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedSubcategory === 'all' 
                ? "We're currently updating our RDP offerings. Please check back soon!"
                : `No ${selectedSubcategory} RDP services available at the moment.`
              }
            </p>
            <Button variant="outline" onClick={() => setSelectedSubcategory('all')}>
              View All Categories
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default RDPProducts;