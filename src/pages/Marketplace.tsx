/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { firestoreService, ProductListing, ProductCategory } from "@/lib/firestore-service";
import { PurchaseRequestModal } from "@/components/PurchaseRequestModal";
import { toast } from "sonner";
import { Loader2, Wifi, Globe, Shield, Monitor, Gift, Box } from "lucide-react";

const fixImgurLink = (url: string) => {
  if (!url) return "";
  const cleanUrl = url.trim();
  if (cleanUrl.includes("imgur.com/a/")) {
    return cleanUrl.replace("imgur.com/a/", "i.imgur.com/") + ".png";
  }
  if (cleanUrl.includes("imgur.com/") && !cleanUrl.includes("i.imgur.com")) {
    return cleanUrl.replace("imgur.com/", "i.imgur.com/") + ".png";
  }
  return cleanUrl;
};

const categories: ProductCategory[] = ['esim', 'proxy', 'vpn', 'rdp', 'gift'];

const categoryIcons: Record<ProductCategory, React.ReactNode> = {
  esim: <Wifi className="h-5 w-5" />,
  proxy: <Globe className="h-5 w-5" />,
  vpn: <Shield className="h-5 w-5" />,
  rdp: <Monitor className="h-5 w-5" />,
  gift: <Gift className="h-5 w-5" />,
};

const categoryLabels: Record<ProductCategory, string> = {
  esim: "eSIM",
  proxy: "Proxy",
  vpn: "VPN",
  rdp: "RDP",
  gift: "Gift Cards",
};

const Marketplace = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductListing | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Fetches real-time data from Firestore 'products' collection
      const data = await firestoreService.getProductListings();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<ProductCategory, ProductListing[]>);

  const handlePurchase = (product: ProductListing) => {
    if (!user) {
      toast.error("Please login to purchase");
      navigate("/login");
      return;
    }

    if (!profile || profile.balance < product.price) {
      toast.error("Insufficient balance. Please top up your account.");
      return;
    }

    setSelectedProduct(product);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = () => {
    navigate("/orders");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Marketplace</h1>
              <p className="text-muted-foreground">
                Premium digital assets and connectivity solutions.
              </p>
            </div>
            {user && profile && (
              <div className="bg-muted/50 px-4 py-2 rounded-lg border border-border flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Balance:</span>
                <span className="text-lg font-bold text-primary">${profile.balance?.toFixed(2) || '0.00'}</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">Fetching latest inventory...</p>
            </div>
          ) : (
            <div className="space-y-16">
              {categories.map((cat) => {
                const categoryProducts = groupedProducts[cat] || [];
                if (categoryProducts.length === 0) return null;

                return (
                  <section key={cat}>
                    <div className="flex items-center justify-between mb-8 border-b pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          {categoryIcons[cat]}
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">{categoryLabels[cat]}</h2>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {categoryProducts.length} AVAILABLE
                      </Badge>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {categoryProducts.map((product) => {
                        const displayImage = fixImgurLink(product.image || product.imageUrl || '');
                        const fallbackImage = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop';
                        
                        // LOGIC: Check both admin's manual 'outOfStock' toggle AND numeric stock count
                        const isSoldOut = product.outOfStock || (product.stock !== undefined && product.stock <= 0);
                        const stockCount = product.stock ?? 0;

                        return (
                          <Card key={product.id} className="overflow-hidden border-border hover:border-primary/50 transition-all duration-300 flex flex-col shadow-sm">
                            <CardHeader className="p-0 relative">
                              <div className="h-40 bg-muted/20 flex items-center justify-center overflow-hidden">
                                <img
                                  src={displayImage || fallbackImage}
                                  alt={product.name}
                                  referrerPolicy="no-referrer"
                                  className={`object-cover h-full w-full transition-transform duration-500 ${!isSoldOut && 'group-hover:scale-110'}`}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = fallbackImage;
                                  }}
                                />
                              </div>
                              {isSoldOut && (
                                <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex items-center justify-center">
                                  <Badge variant="destructive" className="font-black">OUT OF STOCK</Badge>
                                </div>
                              )}
                            </CardHeader>

                            <CardContent className="p-4 flex-1 flex flex-col">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded">
                                  {product.provider}
                                </span>
                                {stockCount > 0 && stockCount < 10 && (
                                  <span className="text-[10px] font-bold text-orange-500 uppercase">
                                    Only {stockCount} left
                                  </span>
                                )}
                              </div>
                              
                              <h3 className="font-bold text-base mb-1 line-clamp-1">
                                {product.name}
                              </h3>
                              
                              {/* DISPLAYING DURATION/VALIDITY FETCHED FROM ADMIN DB */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                                <Box className="h-3 w-3" />
                                <span>{product.duration || product.validity || 'Permanent Access'}</span>
                                {product.dataAmount && <span>• {product.dataAmount}</span>}
                              </div>

                              <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Price</span>
                                  <span className="font-black text-lg">
                                    ${Number(product.price).toFixed(2)}
                                  </span>
                                </div>
                                <Button 
                                  size="sm"
                                  className={`font-bold transition-all ${isSoldOut ? 'bg-muted text-muted-foreground' : 'shadow-md hover:shadow-primary/20'}`}
                                  onClick={() => handlePurchase(product)}
                                  disabled={isSoldOut}
                                >
                                  {isSoldOut ? 'Restocking' : 'Purchase'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      <PurchaseRequestModal
        open={showPurchaseModal}
        onOpenChange={setShowPurchaseModal}
        product={selectedProduct}
        onSuccess={handlePurchaseSuccess}
      />
    </div>
  );
};

export default Marketplace;