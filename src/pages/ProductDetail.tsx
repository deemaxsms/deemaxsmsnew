/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { firestoreService } from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth-context";
import firestoreApi from "@/lib/firestoreApi";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
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
    console.log('ProductDetail useEffect, slug:', slug);
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        let prod = await firestoreService.getProductBySlug(slug || '');
        console.log('Fetched by slug:', prod);

        // Fallback: if no product found by slug, try fetching by document ID
        if (!prod) {
          try {
            const prodById = await firestoreService.getProductById(slug || '');
            console.log('Fetched by id fallback:', prodById);
            if (prodById) prod = prodById;
          } catch (fbErr) {
            console.warn('Error fetching by id fallback:', fbErr);
          }
        }

        if (prod && mounted) {
          // If we loaded by document ID but the product has a slug, redirect to clean slug URL
          if (prod.slug && prod.slug !== slug) {
            try {
              navigate(`/product/${prod.slug}`, { replace: true });
            } catch (navErr) {
              console.warn('Navigation to slug failed', navErr);
            }
          }
          // normalize fields expected by this page
          const mapped = {
            id: prod.id,
            name: prod.name,
            description: prod.description,
            price: prod.price,
            image: prod.category === 'esim' ? prod.image : (prod.imageFilename ? `/assets/proxy-vpn/${prod.imageFilename}` : undefined),
            category: prod.category?.toLowerCase(), // Normalize category to lowercase for conditional logic
            provider: prod.provider,
            duration: prod.duration,
            features: prod.features,
            link: prod.link,
            outOfStock: prod.outOfStock,
            stock: prod.stock, // Ensure stock is available
            comparePrice: prod.comparePrice, // Add if available for strikethrough pricing
            dataAmount: prod.dataAmount,
            validity: prod.validity,
            coverage: prod.coverage,
            subcategory: prod.subcategory
          } as any;
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

  const requestOnWhatsApp = () => {
    let message = `Hello, I am interested in purchasing the following product:\n\nProduct: ${service?.name}\nPrice: $${Number(service?.price).toFixed(2)}\nDuration: ${service?.duration}\nProvider: ${service?.provider}\nQuantity: ${quantity}`;
    if (notes.trim()) {
      message += `\nAdditional Notes: ${notes}`;
    }
    message += `\n\nPlease provide more details and assist with the purchase.`;
    const whatsappUrl = `https://wa.me/2347059450227?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePay = async () => {
    // If user not authenticated, store redirect and go to login
    const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
    if (!user) {
      try {
        localStorage.setItem('post_auth_redirect', currentPath);
      } catch (e) {
        console.warn('Could not set post_auth_redirect', e);
      }
      navigate('/login');
      return;
    }

    const amountUSD = Number(service.price) * quantity;
    const userBalance = profile?.balance || 0;

    // Check if user has sufficient balance (both in USD)
    if (userBalance >= amountUSD) {
      // Show confirmation dialog
      setShowConfirmDialog(true);
    } else {
      // Show insufficient balance dialog
      setRequiredAmount(amountUSD);
      setCurrentBalance(userBalance);
      setShowInsufficientDialog(true);
    }
  };

  const confirmPurchase = async () => {
    setShowConfirmDialog(false);
    
    try {
      const amountUSD = Number(service.price) * quantity;
      
      console.log(`🛒 Starting purchase: ${service.name} for $${amountUSD}`);
      
      // Use the proper purchaseProduct function with atomic transactions
      const requestDetails: any = {
        additionalNotes: `Quantity: ${quantity}`
      };
      
      // Only add specifications if notes exist (avoid undefined)
      if (notes && notes.trim()) {
        requestDetails.specifications = notes.trim();
      }
      
      const result = await firestoreService.purchaseProduct(user.uid, service.id, requestDetails);

      if (result.success) {
        console.log(`✅ Purchase successful: Order ${result.orderId}`);
        
        // Sync balance from server to ensure UI is accurate
        setTimeout(async () => {
          try {
            const freshProfile = await firestoreService.getUserProfile(user.uid);
            if (freshProfile) {
              console.log(`🔄 Balance synced from server: ${freshProfile.balance}`);
              // The page will navigate away, but this ensures consistency
            }
          } catch (syncError) {
            console.warn("Failed to sync balance:", syncError);
          }
        }, 500);
        
        alert('Purchase successful! Your order has been completed.');
        navigate('/orders');
      } else {
        console.error(`❌ Purchase failed: ${result.error}`);
        alert(result.error || 'Failed to complete purchase. Please try again.');
      }
    } catch (err) {
      console.error('❌ Purchase error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      alert(`Failed to complete purchase: ${errorMessage}`);
    }
  };

  const handleFundAccount = () => {
    setShowInsufficientDialog(false);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
    try {
      localStorage.setItem('post_auth_redirect', currentPath);
    } catch (e) {
      console.warn('Could not set post_auth_redirect', e);
    }
    navigate('/top-up');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // TODO: Add toast notification for feedback, e.g., using sonner or shadcn toast
      console.log('Link copied!');
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  // Conditional guide based on category (vpn, proxy, or esim)
  const renderGuide = () => {
    if (service.category?.includes('vpn')) {
      return (
        <div>
          <h3 className="font-medium">For VPN Services:</h3>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Download the VPN app from the provider's website or app store.</li>
            <li>Install and open the app.</li>
            <li>Log in with the credentials provided after purchase.</li>
            <li>Select a server location and connect.</li>
            <li>Enjoy secure browsing!</li>
          </ol>
        </div>
      );
    } else if (service.category?.includes('proxy')) {
      return (
        <div>
          <h3 className="font-medium">For Proxy Services:</h3>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Note down the proxy IP, port, username, and password.</li>
            <li>Configure your device or application to use the proxy settings.</li>
            <li>For browsers: Go to settings &gt; network &gt; proxy and enter the details.</li>
            <li>Test the connection to ensure it's working.</li>
          </ol>
        </div>
      );
    } else if (service.category?.includes('esim')) {
      return (
        <div>
          <h3 className="font-medium">For eSIM Services:</h3>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Ensure your device is eSIM compatible (check with your device manufacturer).</li>
            <li>After purchase, you'll receive an eSIM activation QR code via email.</li>
            <li>Go to Settings &gt; Cellular/Mobile Data &gt; Add Cellular Plan.</li>
            <li>Scan the QR code or enter the activation details manually.</li>
            <li>Follow the prompts to install and activate your eSIM plan.</li>
            <li>Keep your physical SIM active as backup if needed.</li>
          </ol>
        </div>
      );
    }
    return null; // Fallback if no matching category
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-12 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-56 w-full rounded-lg" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
            <aside className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-48 w-full" />
            </aside>
          </div>
        ) : !service ? (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Product Not Found</h2>
            <p className="text-muted-foreground">Sorry, we couldn't find the product you're looking for.</p>
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Go Back
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 order-1 md:order-none">
              {/* Image Section */}
              <div className="rounded-lg overflow-hidden bg-card flex items-center justify-center p-4 shadow-sm">
                {service.image ? (
                  <img 
                    src={service.image} 
                    alt={`${service.name} image`} 
                    className="max-h-[420px] w-full object-contain rounded"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-56 bg-muted flex items-center justify-center text-muted-foreground">No Image Available</div>
                )}
              </div>

              {/* Product Info */}
              <h1 className="mt-6 text-3xl font-bold">{service.name}</h1>
              <p className="text-muted-foreground mt-2 text-lg">{service.description}</p>

              <div className="mt-4 flex flex-wrap gap-4">
                {service.provider && (
                  <Badge variant="secondary" className="text-sm">
                    Provider: {service.provider}
                  </Badge>
                )}
                {service.duration && (
                  <Badge variant="secondary" className="text-sm">
                    Duration: {service.duration}
                  </Badge>
                )}
                {service.dataAmount && (
                  <Badge variant="secondary" className="text-sm">
                    Data: {service.dataAmount}
                  </Badge>
                )}
                {service.validity && (
                  <Badge variant="secondary" className="text-sm">
                    Validity: {service.validity}
                  </Badge>
                )}
                {service.coverage && (
                  <Badge variant="secondary" className="text-sm">
                    Coverage: {service.coverage}
                  </Badge>
                )}
                {service.category && (
                  <Badge variant="outline" className="text-sm">
                    Category: {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
                  </Badge>
                )}
              </div>

              {service.features && service.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-2">Key Features</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {service.features.map((feature: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-center gap-2 before:content-['•'] before:text-primary">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Guide Section */}
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Installation & Usage Guide</h2>
                <div className="space-y-6 bg-card p-6 rounded-lg shadow-sm">
                  {renderGuide() || (
                    <p className="text-sm text-muted-foreground">General setup instructions will be provided after purchase.</p>
                  )}
                </div>
              </div>

              {/* Support Section */}
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
                <div className="bg-card p-6 rounded-lg shadow-sm space-y-2">
                  <p className="text-sm">Contact our support team for assistance:</p>
                  <p className="text-sm"><strong>Phone:</strong> +234 705 945 0227</p>
                  <p className="text-sm"><strong>Email:</strong> smsglobe01@gmail.com</p>
                </div>
              </div>
            </div>

            {/* Sidebar (Purchase Card) - Sticky on medium+ screens */}
            <aside className="rounded-2xl border border-border bg-card p-6 md:sticky md:top-24 h-fit order-2 md:order-none shadow-md">
              {/* Price Display */}
              <div className="mb-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Price per Unit</span>
                  {service.comparePrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground line-through">${Number(service.comparePrice).toFixed(2)}</span>
                      <span className="text-2xl font-bold text-primary">${Number(service.price).toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold">${Number(service.price).toFixed(2)}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Includes all applicable taxes</p>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {service.outOfStock ? (
                  <Badge variant="destructive" className="px-3 py-1">
                    Out of Stock
                  </Badge>
                ) : (
                  <Badge variant="default" className="px-3 py-1 bg-green-500/10 text-green-700">
                    In Stock {typeof service.stock === 'number' ? `(${service.stock} available)` : ''}
                  </Badge>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label htmlFor="quantity" className="text-sm font-medium block mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={service.outOfStock || quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </Button>
                  <div className="h-10 w-20 rounded-md border flex items-center justify-center font-medium text-center">
                    {quantity}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const max = typeof service.stock === 'number' ? service.stock : Infinity;
                      setQuantity((q) => Math.min(max, q + 1));
                    }}
                    disabled={service.outOfStock || (typeof service.stock === 'number' && quantity >= service.stock)}
                    aria-label="Increase quantity"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="mb-6">
                <label htmlFor="notes" className="text-sm font-medium block mb-2">Additional Notes (optional)</label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or instructions?"
                  className="min-h-[80px]"
                  disabled={service.outOfStock}
                />
              </div>

              {/* Total Price */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Total</span>
                  <span className="text-lg font-semibold text-foreground">
                    ${(Number(service.price) * quantity).toFixed(2)}
                  </span>
                </div>
                <div className="h-px bg-border" />
              </div>

              {/* Actions: Pay and Contact */}
              <div className="flex flex-col gap-3">
                <Button className="w-full" onClick={handlePay} disabled={service.outOfStock} size="lg">
                  {service.outOfStock ? 'Out of Stock' : 'Pay Now'}
                </Button>
                <Button variant="outline" className="w-full" onClick={requestOnWhatsApp} disabled={service.outOfStock}>
                  Contact / Request on WhatsApp
                </Button>
              </div>

              {/* Share Section */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Share this product</p>
                <div className="flex items-center gap-3">
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out this product: ${window.location.href}`)}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white hover:opacity-90 transition"
                    aria-label="Share on WhatsApp"
                  >
                    WA
                  </a>
                  <a 
                    href={`https://x.com/intent/tweet?text=Check%20out%20this%20product&url=${encodeURIComponent(window.location.href)}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white hover:opacity-90 transition"
                    aria-label="Share on X"
                  >
                    X
                  </a>
                  <a 
                    href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=Check%20out%20this%20product`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white hover:opacity-90 transition"
                    aria-label="Share on Telegram"
                  >
                    TG
                  </a>
                  {/* Removed IG as it doesn't support direct URL sharing easily; consider app integration if needed */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={handleCopyLink}
                    aria-label="Copy link to clipboard"
                  >
                    ⧉
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to purchase {quantity}x {service?.name} for ${Number(service?.price * quantity).toFixed(2)}?
              This amount will be deducted from your account balance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurchase}>Confirm Purchase</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Insufficient Balance Dialog */}
      <AlertDialog open={showInsufficientDialog} onOpenChange={setShowInsufficientDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Insufficient Balance</AlertDialogTitle>
            <AlertDialogDescription>
              You need ${requiredAmount.toFixed(2)} to complete this order, but you currently have ${currentBalance.toFixed(2)} in your account.
              Please fund your account to proceed with the purchase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFundAccount}>Fund Account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductDetail;