/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { firestoreService } from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Send } from "lucide-react"; // Added icons
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- ADD THE HELPER HERE ---
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

const ProductDetail = () => {
  const { slug } = useParams();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        let prod = await firestoreService.getProductBySlug(slug || '');
        if (!prod) {
          const prodById = await firestoreService.getProductById(slug || '');
          if (prodById) prod = prodById;
        }

        if (prod && mounted) {
          if (prod.slug && prod.slug !== slug) {
            navigate(`/product/${prod.slug}`, { replace: true });
          }

          // --- UPDATED MAPPING LOGIC ---
          const imgurUrl = fixImgurLink(prod.image || prod.imageUrl || '');
          const localPath = prod.imageFilename ? `/assets/proxy-vpn/${prod.imageFilename}` : '';
          const fallbackImage = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80';

          const mapped = {
            ...prod,
            displayImage: imgurUrl || localPath || fallbackImage,
            category: prod.category?.toLowerCase(),
          };
          setService(mapped);
        } else if (mounted) {
          setService(null);
        }
      } catch (e) {
        console.error('Error fetching product:', e);
        if (mounted) setService(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug, navigate]);

  // ... (requestOnWhatsApp, handlePay, confirmPurchase logic remains the same)

  const requestOnWhatsApp = () => {
    let message = `Hello, I am interested in purchasing:\n\nProduct: ${service?.name}\nPrice: $${Number(service?.price).toFixed(2)}\nQuantity: ${quantity}`;
    if (notes.trim()) message += `\nNotes: ${notes}`;
    const whatsappUrl = `https://wa.me/2347059450227?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePay = async () => {
    if (!user) {
      localStorage.setItem('post_auth_redirect', window.location.pathname);
      navigate('/login');
      return;
    }
    const amountUSD = Number(service.price) * quantity;
    const userBalance = profile?.balance || 0;
    if (userBalance >= amountUSD) {
      setShowConfirmDialog(true);
    } else {
      setRequiredAmount(amountUSD);
      setCurrentBalance(userBalance);
      setShowInsufficientDialog(true);
    }
  };

  const confirmPurchase = async () => {
    setShowConfirmDialog(false);
    try {
      const result = await firestoreService.purchaseProduct(user.uid, service.id, {
        additionalNotes: `Quantity: ${quantity}`,
        specifications: notes.trim() || undefined
      });
      if (result.success) {
        alert('Purchase successful!');
        navigate('/orders');
      } else {
        alert(result.error || 'Purchase failed');
      }
    } catch (err) {
      alert('An error occurred during purchase');
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const renderGuide = () => {
    const cat = service.category || '';
    if (cat.includes('vpn')) {
      return (
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Download the official app for your provider.</li>
          <li>Login using credentials sent to your dashboard/email.</li>
          <li>Select a server and connect.</li>
        </ul>
      );
    }
    if (cat.includes('proxy')) {
      return (
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Copy the IP:Port and Auth details.</li>
          <li>Configure your browser or proxy manager.</li>
          <li>Verify connection via "What is my IP".</li>
        </ul>
      );
    }
    return <p className="text-sm text-muted-foreground">Setup instructions will follow purchase.</p>;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-12 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6"><Skeleton className="h-[400px] w-full" /></div>
            <aside><Skeleton className="h-[500px] w-full" /></aside>
          </div>
        ) : !service ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold">Product Not Found</h2>
            <Button variant="link" onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="rounded-xl overflow-hidden bg-white border flex items-center justify-center p-8 shadow-sm mb-8">
                {/* --- FIXED IMAGE TAG --- */}
                <img 
                  src={service.displayImage} 
                  alt={service.name} 
                  referrerPolicy="no-referrer" // CRITICAL
                  className="max-h-[400px] w-auto object-contain transition-opacity duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80';
                  }}
                />
              </div>

              <h1 className="text-4xl font-bold mb-4">{service.name}</h1>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="outline">{service.provider}</Badge>
                <Badge variant="secondary">{service.category?.toUpperCase()}</Badge>
                {service.duration && <Badge>{service.duration}</Badge>}
              </div>
              
              <p className="text-gray-600 text-lg leading-relaxed mb-8">{service.description}</p>

              <div className="bg-muted/30 p-6 rounded-xl border">
                <h3 className="text-xl font-semibold mb-4">How to use</h3>
                {renderGuide()}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-lg sticky top-24">
                <div className="mb-6">
                  <span className="text-gray-500 text-sm">Price per unit</span>
                  <div className="text-3xl font-bold text-primary">${Number(service.price).toFixed(2)}</div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Quantity</label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
                      <div className="flex-1 text-center font-bold border rounded py-1">{quantity}</div>
                      <Button variant="outline" size="sm" onClick={() => setQuantity(q => q + 1)}>+</Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Additional Notes</label>
                    <Textarea 
                      placeholder="e.g. Specific location preferences..." 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className="text-2xl font-bold">${(service.price * quantity).toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Button size="lg" className="w-full" onClick={handlePay}>Pay Now</Button>
                  <Button variant="outline" className="w-full gap-2" onClick={requestOnWhatsApp}>
                    <Send className="h-4 w-4" /> WhatsApp
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full gap-2" onClick={handleCopyLink}>
                    <Copy className="h-3 w-3" /> Copy Product Link
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />

      {/* Dialogs... (Confirmation and Insufficient balance logic) */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Buy {quantity}x {service?.name} for ${(service?.price * quantity).toFixed(2)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurchase}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Insufficient Balance Dialog... */}
      <AlertDialog open={showInsufficientDialog} onOpenChange={setShowInsufficientDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Insufficient Balance</AlertDialogTitle>
            <AlertDialogDescription>
              Current: ${currentBalance.toFixed(2)} | Required: ${requiredAmount.toFixed(2)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/top-up')}>Fund Account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductDetail;