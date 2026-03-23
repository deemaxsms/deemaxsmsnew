/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { firestoreService, ProductListing } from "@/lib/firestore-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PurchaseRequestModal } from "@/components/PurchaseRequestModal";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

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

const ProviderProducts = () => {
  const { provider } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [items, setItems] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductListing | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const vpn = await firestoreService.getProductListings('vpn');
        const proxy = await firestoreService.getProductListings('proxy');
        const esim = await firestoreService.getProductListings('esim');
        const rdp = await firestoreService.getProductListings('rdp');
        const gift = await firestoreService.getProductListings('gift');
        
        const merged = [
          ...(vpn || []), 
          ...(proxy || []), 
          ...(esim || []), 
          ...(rdp || []), 
          ...(gift || [])
        ];
        
        const filtered = merged.filter(p => p.provider === decodeURIComponent(provider || ''));
        if (mounted) setItems(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [provider]);

  const handlePurchaseClick = (product: ProductListing) => {
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
      <main className="flex-1 container px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{decodeURIComponent(provider || '')} Products</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our collection of amazing products from {decodeURIComponent(provider || '')}.
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
            {items.map((p) => {
              const fallbackImage = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop';
              const imgurUrl = fixImgurLink(p.image || p.imageUrl || '');
              const localPath = p.imageFilename ? `/assets/proxy-vpn/${p.imageFilename}` : '';
              const finalImage = imgurUrl || localPath || fallbackImage;

              return (
                <Card key={p.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col">
                  <CardHeader className="p-0 relative">
                    <div className="h-48 bg-muted/20 flex items-center justify-center overflow-hidden">
                      <img
                        src={finalImage}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackImage;
                        }}
                      />
                    </div>
                    <Badge
                      variant="default"
                      className="absolute top-3 left-3 text-xs font-medium uppercase"
                    >
                      {p.category}
                    </Badge>
                    {p.outOfStock && (
                      <Badge variant="destructive" className="absolute top-3 right-3 text-xs">
                        Out of Stock
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="text-sm text-muted-foreground mb-1">{p.provider}</div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{p.name}</h3>
                    <div className="text-xs text-muted-foreground mb-3 font-medium">
                       {p.validity || p.duration} {p.dataAmount ? `• ${p.dataAmount}` : ''}
                    </div>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between border-t">
                      <div className="font-bold text-xl text-primary">
                        ${Number(p.price).toFixed(2)}
                      </div>
                      <Button 
                        size="sm"
                        variant={p.outOfStock ? "secondary" : "default"}
                        disabled={p.outOfStock}
                        onClick={() => handlePurchaseClick(p)}
                        className="font-bold"
                      >
                        {p.outOfStock ? "Sold Out" : "Buy Now"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
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

export default ProviderProducts;