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
import { Loader2, Wifi, Globe, Shield, Monitor, Gift, ShoppingCart } from "lucide-react";

// Helper to convert Imgur Album links to Direct Image links
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

// Define categories array strictly to help TypeScript mapping
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
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Marketplace</h1>
            <p className="text-muted-foreground">
              Browse eSIMs, Proxies, VPNs, RDP, and Gift Cards
            </p>
          </div>

          {user && profile && (
            <Card className="bg-primary text-primary-foreground border-none shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 font-medium">Your Available Balance</p>
                    <p className="text-3xl font-bold">${profile.balance?.toFixed(2) || '0.00'}</p>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="font-semibold"
                    onClick={() => navigate("/dashboard")}
                  >
                    Top Up Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-16">
              {categories.map((cat) => {
                const categoryProducts = groupedProducts[cat] || [];
                if (categoryProducts.length === 0) return null;

                return (
                  <section key={cat}>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                        {categoryIcons[cat]}
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight">{categoryLabels[cat]}</h2>
                      <Badge variant="outline" className="ml-2 font-bold uppercase tracking-wider text-[10px]">
                        {categoryProducts.length} Items
                      </Badge>
                    </div>

                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {categoryProducts.map((product) => {
                        const displayImage = fixImgurLink(product.image || product.imageUrl || '');
                        const fallbackImage = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop';

                        return (
                          <Card key={product.id} className="overflow-hidden border-muted hover:shadow-xl transition-all duration-300 group flex flex-col">
                            <CardHeader className="p-0 relative">
                              <div className="h-44 bg-muted/20 flex items-center justify-center overflow-hidden">
                                <img
                                  src={displayImage || fallbackImage}
                                  alt={product.name}
                                  referrerPolicy="no-referrer"
                                  className="object-cover h-full w-full group-hover:scale-110 transition-transform duration-700"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = fallbackImage;
                                  }}
                                />
                              </div>
                              {product.outOfStock && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                                  <Badge variant="destructive" className="px-4 py-1 font-bold shadow-lg">
                                    SOLD OUT
                                  </Badge>
                                </div>
                              )}
                            </CardHeader>

                            <CardContent className="p-5 flex-1 flex flex-col">
                              <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">
                                {product.provider}
                              </div>
                              <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                              
                              <p className="text-xs text-muted-foreground mb-4 font-medium italic">
                                {product.validity} • {product.dataAmount}
                              </p>

                              <div className="mt-auto pt-4 border-t border-muted/50 flex items-center justify-between">
                                <div className="font-black text-xl text-foreground">
                                  ${Number(product.price).toFixed(2)}
                                </div>
                                <Button 
                                  size="sm"
                                  className="rounded-full px-4 font-bold shadow-sm"
                                  onClick={() => handlePurchase(product)}
                                  disabled={product.outOfStock}
                                >
                                  {product.outOfStock ? 'Closed' : 'Buy Now'}
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