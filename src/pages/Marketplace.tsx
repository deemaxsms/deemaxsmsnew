import { useState, useEffect } from "react";
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
import { Loader2, Wifi, Globe, Shield, Monitor, Gift, ShoppingCart, Clock, Check } from "lucide-react";

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
  const { user, profile, deductFromBalance } = useAuth();
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
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

          {/* Balance Card */}
          {user && profile && (
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Your Balance</p>
                    <p className="text-2xl font-bold">${profile.balance?.toFixed(2) || '0.00'}</p>
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate("/dashboard")}
                  >
                    Top Up
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-12">
              {(Object.keys(categoryLabels) as ProductCategory[]).map((cat) => {
                const categoryProducts = groupedProducts[cat] || [];
                if (categoryProducts.length === 0) return null;

                return (
                  <section key={cat}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {categoryIcons[cat]}
                      </div>
                      <h2 className="text-2xl font-bold">{categoryLabels[cat]}</h2>
                      <Badge variant="secondary">{categoryProducts.length} products</Badge>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {categoryProducts.map((product) => (
                        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                          <CardHeader className="p-0 relative">
                            <div className="h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                              <img
                                src={product.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop'}
                                alt={product.name}
                                className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <Badge
                              variant="default"
                              className="absolute top-3 left-3 text-xs font-medium"
                            >
                              {categoryLabels[product.category]}
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
                            <div className="text-sm text-muted-foreground mb-3">{product.validity} • {product.dataAmount}</div>
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
                            <div className="flex items-center justify-between mb-4">
                              <div className="font-bold text-xl text-primary">
                                ${Number(product.price).toFixed(2)}
                              </div>
                            </div>
                            <Button 
                              className="w-full"
                              onClick={() => handlePurchase(product)}
                              disabled={purchasing === product.id || product.outOfStock}
                            >
                              {purchasing === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <ShoppingCart className="h-4 w-4 mr-2" />
                              )}
                              {product.outOfStock ? 'Out of Stock' : 'Purchase'}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      {/* Purchase Request Modal */}
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
