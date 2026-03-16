import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { firestoreService, ProductListing, ProductOrder, ProductCategory } from "@/lib/firestore-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, ShoppingCart, Users, DollarSign, CheckCircle, Clock, XCircle, RefreshCw, LogOut, Eye } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const ALLOWED_ADMIN_EMAILS = ["muhammednetr@gmail.com", "ola@gmail.com"];

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';

export default function Admin() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Product form state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductListing | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'vpn' as ProductCategory,
    description: '',
    price: 0,
    features: '',
    duration: '',
    region: '',
    provider: '',
    isActive: true,
  });
  
  // Order detail state
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
  const [deliveryDetails, setDeliveryDetails] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (!loading) {
      const allowed = !!(profile?.isAdmin || (user?.email && ALLOWED_ADMIN_EMAILS.includes(user.email)));
      setIsAdmin(Boolean(allowed || false));
    }
  }, [loading, profile, user]);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [p, o] = await Promise.all([
        firestoreService.getAllProductListings(),
        firestoreService.getAllProductOrders()
      ]);
      setProducts(p);
      // Cast status to the correct type
      setOrders(o.map(order => ({
        ...order,
        status: order.status as OrderStatus
      })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (!user) return toast.error("Please login first");
    if (!user.email || !ALLOWED_ADMIN_EMAILS.includes(user.email)) {
      return toast.error("Your email is not allowed to create an admin account.");
    }
    try {
      await firestoreService.updateUserProfile(user.uid, { isAdmin: true });
      await refreshProfile();
      toast.success("Admin account created. You now have admin access.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create admin account");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Product CRUD
  const openProductDialog = (product?: ProductListing) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category,
        description: product.description,
        price: product.price,
        features: product.features?.join('\n') || '',
        duration: product.duration || '',
        region: product.region || '',
        provider: product.provider || '',
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: 'vpn',
        description: '',
        price: 0,
        features: '',
        duration: '',
        region: '',
        provider: '',
        isActive: true,
      });
    }
    setProductDialogOpen(true);
  };

  const saveProduct = async () => {
    try {
      const productData = {
        name: productForm.name,
        category: productForm.category,
        description: productForm.description,
        price: productForm.price,
        features: productForm.features.split('\n').filter(f => f.trim()),
        duration: productForm.duration,
        region: productForm.region,
        provider: productForm.provider,
        isActive: productForm.isActive,
      };

      if (editingProduct) {
        await firestoreService.updateProductListing(editingProduct.id, productData);
        toast.success("Product updated");
      } else {
        await firestoreService.createProductListing(productData);
        toast.success("Product created");
      }
      setProductDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save product");
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await firestoreService.deleteProductListing(productId);
      toast.success("Product deleted");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product");
    }
  };

  const toggleProductActive = async (product: ProductListing) => {
    try {
      await firestoreService.updateProductListing(product.id, { isActive: !product.isActive });
      toast.success(`Product ${product.isActive ? 'deactivated' : 'activated'}`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update product");
    }
  };

  // Order management
  const openOrderDialog = (order: ProductOrder) => {
    setSelectedOrder(order);
    setDeliveryDetails(order.deliveryDetails || '');
    setAdminNotes(order.adminNotes || '');
    setOrderDialogOpen(true);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updateData: Partial<ProductOrder> = { status };
      if (status === 'completed') {
        updateData.deliveryDetails = deliveryDetails;
        updateData.adminNotes = adminNotes;
      }
      await firestoreService.updateProductOrder(orderId, updateData);
      toast.success(`Order marked as ${status}`);
      setOrderDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3 mr-1" /> },
      processing: { variant: 'default', icon: <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> },
      completed: { variant: 'outline', icon: <CheckCircle className="w-3 h-3 mr-1 text-green-500" /> },
      cancelled: { variant: 'destructive', icon: <XCircle className="w-3 h-3 mr-1" /> },
      refunded: { variant: 'destructive', icon: <DollarSign className="w-3 h-3 mr-1" /> },
    };
    const v = variants[status] || variants.pending;
    return (
      <Badge variant={v.variant} className="flex items-center">
        {v.icon}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <h2 className="text-2xl font-bold">Admin Access Required</h2>
          <p className="mt-4 text-muted-foreground">Please log in with an authorized admin email.</p>
          <Button className="mt-4" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile?.isAdmin && (!user.email || !ALLOWED_ADMIN_EMAILS.includes(user.email))) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <h2 className="text-2xl font-bold">Unauthorized</h2>
          <p className="mt-4 text-muted-foreground">Your account is not authorized to access admin features.</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Stats
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.price, 0);
  const activeProducts = products.filter(p => p.isActive).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage products, orders, and users</p>
          </div>
          <div className="flex items-center gap-2">
            {!profile?.isAdmin && (
              <Button onClick={handleMakeAdmin} variant="outline">
                Activate Admin
              </Button>
            )}
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Products</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {activeProducts}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Orders</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                {pendingOrders}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed Orders</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {completedOrders}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                ${totalRevenue.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Orders ({orders.length})</h2>
              <Button variant="outline" size="sm" onClick={loadData} disabled={loadingData}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No orders yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {orders.map(order => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{order.productName}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.userEmail} {order.username && `(@${order.username})`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Category: {order.category} • Price: ${order.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openOrderDialog(order)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Products ({products.length})</h2>
              <Button onClick={() => openProductDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
            
            {products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No products yet. Create your first product.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {products.map(product => (
                  <Card key={product.id} className={`transition-all ${!product.isActive && 'opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{product.name}</span>
                            <Badge variant={product.isActive ? 'default' : 'secondary'}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">{product.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {product.description}
                          </p>
                          <p className="text-sm font-medium text-primary">
                            ${product.price.toFixed(2)} {product.duration && `• ${product.duration}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={product.isActive} 
                            onCheckedChange={() => toggleProductActive(product)}
                          />
                          <Button size="sm" variant="ghost" onClick={() => openProductDialog(product)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteProduct(product.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Quick summary of your marketplace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold">{products.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{orders.length}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Orders by Status</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Pending: {pendingOrders}</Badge>
                    <Badge variant="default">Processing: {orders.filter(o => o.status === 'processing').length}</Badge>
                    <Badge variant="outline" className="text-green-500">Completed: {completedOrders}</Badge>
                    <Badge variant="destructive">Cancelled: {orders.filter(o => o.status === 'cancelled').length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              Fill in the product details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={productForm.name} 
                onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Product name"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={productForm.category} onValueChange={(v: ProductCategory) => setProductForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vpn">VPN</SelectItem>
                  <SelectItem value="proxy">Proxy</SelectItem>
                  <SelectItem value="esim">eSIM</SelectItem>
                  <SelectItem value="rdp">RDP</SelectItem>
                  <SelectItem value="gift">Gift Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input 
                value={productForm.provider} 
                onChange={e => setProductForm(f => ({ ...f, provider: e.target.value }))}
                placeholder="e.g., NordVPN, ExpressVPN"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={productForm.description} 
                onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Product description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (USD)</Label>
                <Input 
                  type="number"
                  value={productForm.price} 
                  onChange={e => setProductForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input 
                  value={productForm.duration} 
                  onChange={e => setProductForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="e.g., 30 days"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input 
                value={productForm.region} 
                onChange={e => setProductForm(f => ({ ...f, region: e.target.value }))}
                placeholder="e.g., Global, USA, Europe"
              />
            </div>
            <div className="space-y-2">
              <Label>Features (one per line)</Label>
              <Textarea 
                value={productForm.features} 
                onChange={e => setProductForm(f => ({ ...f, features: e.target.value }))}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={productForm.isActive} 
                onCheckedChange={v => setProductForm(f => ({ ...f, isActive: v }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveProduct}>Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Order</DialogTitle>
            <DialogDescription>
              View and update order details
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-medium">{selectedOrder.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline">{selectedOrder.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">${selectedOrder.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{selectedOrder.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Delivery Details (credentials, links, etc.)</Label>
                <Textarea 
                  value={deliveryDetails} 
                  onChange={e => setDeliveryDetails(e.target.value)}
                  placeholder="Enter VPN credentials, eSIM QR code link, etc."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Admin Notes (internal)</Label>
                <Textarea 
                  value={adminNotes} 
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Internal notes..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedOrder?.status !== 'completed' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => updateOrderStatus(selectedOrder!.id, 'processing')}
                  className="w-full sm:w-auto"
                >
                  Mark Processing
                </Button>
                <Button 
                  onClick={() => updateOrderStatus(selectedOrder!.id, 'completed')}
                  className="w-full sm:w-auto"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Order
                </Button>
              </>
            )}
            {selectedOrder?.status !== 'cancelled' && selectedOrder?.status !== 'completed' && (
              <Button 
                variant="destructive" 
                onClick={() => updateOrderStatus(selectedOrder!.id, 'cancelled')}
                className="w-full sm:w-auto"
              >
                Cancel Order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
