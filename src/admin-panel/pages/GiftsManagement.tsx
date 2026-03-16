import { useEffect, useState } from 'react';
import { adminService } from '../lib/admin-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Gift, Package, Search, Edit, Eye, CheckCircle, XCircle, Clock, DollarSign, User, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { formatStatsAmount } from '../lib/currency-utils';

export function GiftsManagement() {
  const [giftOrders, setGiftOrders] = useState<any[]>([]);
  const [giftCatalog, setGiftCatalog] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  
  // Dialog states
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form states
  const [fulfillmentData, setFulfillmentData] = useState({
    trackingNumber: '',
    courierName: '',
    estimatedDelivery: '',
    fulfillmentNotes: ''
  });
  
  const [offerData, setOfferData] = useState({
    proposedPrice: 0,
    shippingFee: 0,
    estimatedDays: 7,
    offerMessage: '',
    productImages: [] as string[],
    productUrl: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [ordersData, catalogData, requestsData] = await Promise.all([
        adminService.getAllGiftOrders(),
        adminService.getAllGifts(),
        adminService.getAllCustomGiftRequests()
      ]);
      
      setGiftOrders(ordersData);
      setGiftCatalog(catalogData);
      setCustomRequests(requestsData);
    } catch (error) {
      console.error('Error loading gift data:', error);
      toast.error('Failed to load gift data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    switch (activeTab) {
      case 'orders':
        return giftOrders.filter(order => {
          const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.giftTitle?.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesSearch;
        });
      case 'catalog':
        return giftCatalog.filter(gift => {
          const matchesSearch = gift.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            gift.description?.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesSearch;
        });
      case 'requests':
        return customRequests.filter(request => {
          const matchesSearch = request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.description?.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesSearch;
        });
      default:
        return [];
    }
  };

  const filteredData = getFilteredData();

  // Order fulfillment functions
  const handleAcceptOrder = async (order: any) => {
    try {
      setActionLoading(true);
      await adminService.updateGiftOrderStatus(order.id, 'processing', 'Order accepted by admin');
      toast.success('Order accepted and moved to processing');
      loadAllData();
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfillOrder = async () => {
    if (!selectedItem) return;
    
    try {
      setActionLoading(true);
      await adminService.updateGiftOrderTracking(
        selectedItem.id,
        fulfillmentData.trackingNumber,
        fulfillmentData.courierName
      );
      await adminService.updateGiftOrderStatus(
        selectedItem.id,
        'shipped',
        fulfillmentData.fulfillmentNotes
      );
      
      toast.success('Order fulfilled and tracking information updated');
      setFulfillmentDialogOpen(false);
      loadAllData();
    } catch (error) {
      console.error('Error fulfilling order:', error);
      toast.error('Failed to fulfill order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitOffer = async () => {
    if (!selectedItem) return;
    
    try {
      setActionLoading(true);
      const totalAmount = offerData.proposedPrice + offerData.shippingFee;
      
      await adminService.updateCustomGiftRequestStatus(
        selectedItem.id,
        'priced',
        {
          status: 'pending_user_approval',
          finalPrice: offerData.proposedPrice,
          shippingFee: offerData.shippingFee,
          totalAmount,
          estimatedDeliveryDays: offerData.estimatedDays,
          productImages: offerData.productImages,
          productUrl: offerData.productUrl,
          adminMessage: offerData.offerMessage,
          respondedAt: new Date()
        }
      );
      
      toast.success('Offer submitted to customer');
      setOfferDialogOpen(false);
      loadAllData();
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast.error('Failed to submit offer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (request: any) => {
    try {
      setActionLoading(true);
      await adminService.updateCustomGiftRequestStatus(
        request.id,
        'rejected',
        {
          status: 'rejected',
          adminMessage: 'Request cannot be fulfilled at this time',
          respondedAt: new Date()
        }
      );
      
      toast.success('Request rejected');
      loadAllData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const generateTrackingNumber = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TRK-${timestamp.toString().slice(-6)}-${random}`;
  };

  const openFulfillmentDialog = (order: any) => {
    setSelectedItem(order);
    setFulfillmentData({
      trackingNumber: order.trackingNumber || generateTrackingNumber(),
      courierName: order.courierName || '',
      estimatedDelivery: order.estimatedDeliveryDate || '',
      fulfillmentNotes: ''
    });
    setFulfillmentDialogOpen(true);
  };

  const openOfferDialog = (request: any) => {
    setSelectedItem(request);
    setOfferData({
      proposedPrice: request.budgetMax || 0,
      shippingFee: 0,
      estimatedDays: 7,
      offerMessage: '',
      productImages: [],
      productUrl: ''
    });
    setOfferDialogOpen(true);
  };

  const openDetailsDialog = (item: any) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gifts Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage gift orders, catalog, and custom requests</p>
        </div>
        <Button onClick={loadAllData} variant="outline" className="w-full sm:w-auto">
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl">Search</CardTitle>
          <CardDescription className="text-sm">Search across all gift data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gifts, orders, requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl">Gift Management</CardTitle>
          <CardDescription className="text-sm">Manage different aspects of the gift system</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4 sm:px-0">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="orders" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Gift Orders</span>
                  <span className="sm:hidden">Orders</span>
                  <span className="ml-1">({giftOrders.length})</span>
                </TabsTrigger>
                <TabsTrigger value="catalog" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Gift Catalog</span>
                  <span className="sm:hidden">Catalog</span>
                  <span className="ml-1">({giftCatalog.length})</span>
                </TabsTrigger>
                <TabsTrigger value="requests" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Custom Requests</span>
                  <span className="sm:hidden">Requests</span>
                  <span className="ml-1">({customRequests.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={activeTab} className="mt-0">
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3 px-4">
                {filteredData.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No data found</p>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? `No results for "${searchTerm}"` : `No ${activeTab} available`}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredData.map((item, index) => (
                    <Card key={item.id || index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Gift className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {activeTab === 'orders' && item.orderNumber}
                                {activeTab === 'catalog' && item.title}
                                {activeTab === 'requests' && item.title}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {activeTab === 'orders' && item.giftTitle}
                                {activeTab === 'catalog' && item.description?.substring(0, 50)}
                                {activeTab === 'requests' && item.description?.substring(0, 50)}
                              </div>
                            </div>
                          </div>
                          <Badge variant={
                            activeTab === 'orders' ? (
                              item.status === 'delivered' ? 'default' :
                              item.status === 'shipped' ? 'secondary' :
                              item.status === 'processing' ? 'outline' :
                              item.status === 'cancelled' ? 'destructive' : 'outline'
                            ) : activeTab === 'catalog' ? (
                              item.isActive ? 'default' : 'secondary'
                            ) : (
                              item.status === 'completed' ? 'default' :
                              item.status === 'approved' ? 'secondary' :
                              item.status === 'rejected' ? 'destructive' : 'outline'
                            )
                          } className="text-xs">
                            {activeTab === 'orders' && (item.status?.replace('_', ' ').toUpperCase() || 'PENDING')}
                            {activeTab === 'catalog' && (item.isActive ? 'Active' : 'Inactive')}
                            {activeTab === 'requests' && (item.status?.toUpperCase() || 'PENDING')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">
                              {activeTab === 'orders' && 'Sender:'}
                              {activeTab === 'catalog' && 'Price:'}
                              {activeTab === 'requests' && 'Budget:'}
                            </span>
                            <div className="font-medium">
                              {activeTab === 'orders' && item.senderName}
                              {activeTab === 'catalog' && formatStatsAmount(item.basePrice || 0).primary}
                              {activeTab === 'requests' && `${formatStatsAmount(item.budgetMin || 0).primary} - ${formatStatsAmount(item.budgetMax || 0).primary}`}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              {activeTab === 'orders' && 'Amount:'}
                              {activeTab === 'catalog' && 'Category:'}
                              {activeTab === 'requests' && 'Location:'}
                            </span>
                            <div className="font-medium">
                              {activeTab === 'orders' && formatStatsAmount(item.totalAmount || 0).primary}
                              {activeTab === 'catalog' && (item.categoryId || 'General')}
                              {activeTab === 'requests' && `${item.deliveryCountry}, ${item.deliveryCity}`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <Button size="sm" variant="outline" onClick={() => openDetailsDialog(item)} className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          
                          <div className="flex gap-2">
                            {activeTab === 'orders' && (
                              <>
                                {item.status === 'confirmed' && (
                                  <Button size="sm" variant="default" onClick={() => handleAcceptOrder(item)} className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Accept
                                  </Button>
                                )}
                                {item.status === 'processing' && (
                                  <Button size="sm" variant="secondary" onClick={() => openFulfillmentDialog(item)} className="text-xs">
                                    <Package className="h-3 w-3 mr-1" />
                                    Fulfill
                                  </Button>
                                )}
                              </>
                            )}
                            
                            {activeTab === 'requests' && item.status === 'pending' && (
                              <>
                                <Button size="sm" variant="default" onClick={() => openOfferDialog(item)} className="text-xs">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Offer
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(item)} className="text-xs">
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            
                            {activeTab === 'catalog' && (
                              <Button size="sm" variant="outline" className="text-xs">
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeTab === 'orders' && (
                        <>
                          <TableHead>Order</TableHead>
                          <TableHead>Sender</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </>
                      )}
                      {activeTab === 'catalog' && (
                        <>
                          <TableHead>Gift</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Actions</TableHead>
                        </>
                      )}
                      {activeTab === 'requests' && (
                        <>
                          <TableHead>Request</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Package className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">No data found</p>
                            <p className="text-sm text-muted-foreground">
                              {searchTerm ? `No results for "${searchTerm}"` : `No ${activeTab} available`}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Gift className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {activeTab === 'orders' && item.orderNumber}
                                  {activeTab === 'catalog' && item.title}
                                  {activeTab === 'requests' && item.title}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {activeTab === 'orders' && item.giftTitle}
                                  {activeTab === 'catalog' && item.description?.substring(0, 50)}
                                  {activeTab === 'requests' && item.description?.substring(0, 50)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {activeTab === 'orders' && (
                              <div>
                                <div className="font-medium">{item.senderName}</div>
                                <div className="text-sm text-muted-foreground">{item.senderEmail}</div>
                              </div>
                            )}
                            {activeTab === 'catalog' && (
                              <Badge variant="outline">{item.categoryId || 'General'}</Badge>
                            )}
                            {activeTab === 'requests' && (
                              <div className="font-medium">
                                {formatStatsAmount(item.budgetMin || 0).primary} - {formatStatsAmount(item.budgetMax || 0).primary}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {activeTab === 'orders' && (
                              <div>
                                <div className="font-medium">{item.recipientName}</div>
                                <div className="text-sm text-muted-foreground">{item.recipientPhone}</div>
                              </div>
                            )}
                            {activeTab === 'catalog' && (
                              <div>
                                <div className="font-medium">{formatStatsAmount(item.basePrice || 0).primary}</div>
                                <div className="text-xs text-muted-foreground">{formatStatsAmount(item.basePrice || 0).secondary}</div>
                              </div>
                            )}
                            {activeTab === 'requests' && (
                              <div className="text-sm">
                                <div>{item.deliveryCountry}</div>
                                <div className="text-muted-foreground">{item.deliveryCity}</div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {activeTab === 'orders' && (
                              <div>
                                <div className="font-medium">{formatStatsAmount(item.totalAmount || 0).primary}</div>
                                <div className="text-xs text-muted-foreground">{formatStatsAmount(item.totalAmount || 0).secondary}</div>
                              </div>
                            )}
                            {activeTab === 'catalog' && (
                              <Badge variant={item.isActive ? 'default' : 'secondary'}>
                                {item.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            )}
                            {activeTab === 'requests' && (
                              <Badge variant={
                                item.status === 'completed' ? 'default' :
                                item.status === 'approved' ? 'secondary' :
                                item.status === 'rejected' ? 'destructive' : 'outline'
                              }>
                                {item.status?.toUpperCase() || 'PENDING'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {activeTab === 'orders' && (
                              <Badge variant={
                                item.status === 'delivered' ? 'default' :
                                item.status === 'shipped' ? 'secondary' :
                                item.status === 'processing' ? 'outline' :
                                item.status === 'cancelled' ? 'destructive' : 'outline'
                              }>
                                {item.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                              </Badge>
                            )}
                            {activeTab === 'catalog' && (
                              <div className="text-sm">
                                {item.weight}kg • {item.sizeClass}
                              </div>
                            )}
                            {activeTab === 'requests' && (
                              <div className="text-sm text-muted-foreground">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => openDetailsDialog(item)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                              
                              {activeTab === 'orders' && (
                                <>
                                  {item.status === 'confirmed' && (
                                    <Button size="sm" variant="default" onClick={() => handleAcceptOrder(item)}>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Accept
                                    </Button>
                                  )}
                                  {item.status === 'processing' && (
                                    <Button size="sm" variant="secondary" onClick={() => openFulfillmentDialog(item)}>
                                      <Package className="h-3 w-3 mr-1" />
                                      Fulfill
                                    </Button>
                                  )}
                                </>
                              )}
                              
                              {activeTab === 'requests' && item.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="default" onClick={() => openOfferDialog(item)}>
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Offer
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(item)}>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              
                              {activeTab === 'catalog' && (
                                <Button size="sm" variant="outline">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {activeTab === 'orders' && 'Gift Order Details'}
              {activeTab === 'catalog' && 'Gift Catalog Item Details'}
              {activeTab === 'requests' && 'Custom Gift Request Details'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Complete information about this {activeTab.slice(0, -1)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              {/* Order Details */}
              {activeTab === 'orders' && (
                <div className="grid gap-6">
                  {/* Order Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                          Order Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Order Number</Label>
                          <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{selectedItem.orderNumber}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Gift Title</Label>
                          <p className="text-sm font-medium">{selectedItem.giftTitle}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Quantity</Label>
                          <p className="text-sm">{selectedItem.quantity || 1}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Currency</Label>
                          <p className="text-sm">{selectedItem.currency || 'USD'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Badge variant={
                            selectedItem.status === 'delivered' ? 'default' :
                            selectedItem.status === 'shipped' ? 'secondary' :
                            selectedItem.status === 'processing' ? 'outline' :
                            selectedItem.status === 'cancelled' ? 'destructive' : 'outline'
                          }>
                            {selectedItem.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Order Date</Label>
                          <p className="text-sm">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : 'N/A'}</p>
                        </div>
                        {selectedItem.giftId && (
                          <div>
                            <Label className="text-sm font-medium">Gift ID</Label>
                            <p className="text-xs text-muted-foreground font-mono">{selectedItem.giftId}</p>
                          </div>
                        )}
                        {selectedItem.customRequestId && (
                          <div>
                            <Label className="text-sm font-medium">Custom Request ID</Label>
                            <p className="text-xs text-muted-foreground font-mono">{selectedItem.customRequestId}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                          Pricing Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Gift Price</Label>
                          <p className="text-sm">{formatStatsAmount(selectedItem.giftPrice || 0).primary}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Shipping Fee</Label>
                          <p className="text-sm">{formatStatsAmount(selectedItem.shippingFee || 0).primary}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Total Amount</Label>
                          <p className="text-lg font-bold text-primary">{formatStatsAmount(selectedItem.totalAmount || 0).primary}</p>
                          <p className="text-sm text-muted-foreground">{formatStatsAmount(selectedItem.totalAmount || 0).secondary}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Payment Status</Label>
                          <Badge variant={selectedItem.paymentStatus === 'completed' ? 'default' : 'outline'}>
                            {selectedItem.paymentStatus?.toUpperCase() || 'PENDING'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sender and Recipient Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <User className="h-4 w-4 sm:h-5 sm:w-5" />
                          Sender Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Name</Label>
                          <p className="text-sm">{selectedItem.senderName || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Email</Label>
                          <p className="text-sm">{selectedItem.senderEmail || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Phone</Label>
                          <p className="text-sm">{selectedItem.senderPhone || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Show Name to Recipient</Label>
                          <Badge variant={selectedItem.showSenderName ? 'default' : 'secondary'}>
                            {selectedItem.showSenderName ? 'Yes' : 'Anonymous'}
                          </Badge>
                        </div>
                        {selectedItem.senderMessage && (
                          <div>
                            <Label className="text-sm font-medium">Message</Label>
                            <p className="text-sm bg-muted p-2 rounded">{selectedItem.senderMessage}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                          Recipient Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Name</Label>
                          <p className="text-sm">{selectedItem.recipientName || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Phone</Label>
                          <p className="text-sm">{selectedItem.recipientPhone || 'N/A'}</p>
                        </div>
                        {selectedItem.recipientEmail && (
                          <div>
                            <Label className="text-sm font-medium">Email</Label>
                            <p className="text-sm">{selectedItem.recipientEmail}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-sm font-medium">Preferred Delivery Time</Label>
                          <Badge variant="outline">
                            {selectedItem.preferredDeliveryTime?.charAt(0).toUpperCase() + selectedItem.preferredDeliveryTime?.slice(1) || 'Anytime'}
                          </Badge>
                        </div>
                        {selectedItem.deliveryAddress && (
                          <div>
                            <Label className="text-sm font-medium">Delivery Address</Label>
                            <p className="text-sm">{selectedItem.deliveryAddress.addressLine}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedItem.deliveryAddress.city}, {selectedItem.deliveryAddress.state}, {selectedItem.deliveryAddress.countryName}
                            </p>
                            {selectedItem.deliveryAddress.landmark && (
                              <p className="text-xs text-muted-foreground">
                                Landmark: {selectedItem.deliveryAddress.landmark}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Delivery Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                        Delivery & Tracking Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Target Delivery</Label>
                        <p className="text-sm">{selectedItem.targetDeliveryDate || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Estimated Delivery</Label>
                        <p className="text-sm">{selectedItem.estimatedDeliveryDate || 'N/A'}</p>
                      </div>
                      {selectedItem.actualDeliveryDate && (
                        <div>
                          <Label className="text-sm font-medium">Actual Delivery</Label>
                          <p className="text-sm">{selectedItem.actualDeliveryDate}</p>
                        </div>
                      )}
                      {selectedItem.trackingNumber && (
                        <div>
                          <Label className="text-sm font-medium">Tracking Number</Label>
                          <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{selectedItem.trackingNumber}</p>
                        </div>
                      )}
                      {selectedItem.courierName && (
                        <div>
                          <Label className="text-sm font-medium">Courier</Label>
                          <p className="text-sm">{selectedItem.courierName}</p>
                        </div>
                      )}
                      {selectedItem.deliveryInstructions && (
                        <div className="col-span-full">
                          <Label className="text-sm font-medium">Delivery Instructions</Label>
                          <p className="text-sm bg-muted p-2 rounded">{selectedItem.deliveryInstructions}</p>
                        </div>
                      )}
                      {selectedItem.adminNotes && (
                        <div className="col-span-full">
                          <Label className="text-sm font-medium">Admin Notes</Label>
                          <p className="text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-400">{selectedItem.adminNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Gift Images */}
                  {selectedItem.giftImages && selectedItem.giftImages.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Gift Images</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {selectedItem.giftImages.map((image: string, index: number) => (
                            <img
                              key={index}
                              src={image}
                              alt={`${selectedItem.giftTitle} ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Catalog Item Details */}
              {activeTab === 'catalog' && (
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Gift Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <p className="text-sm">{selectedItem.title}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Description</Label>
                          <p className="text-sm">{selectedItem.description}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Category</Label>
                          <Badge variant="outline">{selectedItem.categoryId || 'General'}</Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Badge variant={selectedItem.isActive ? 'default' : 'secondary'}>
                            {selectedItem.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Pricing & Shipping</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Base Price</Label>
                          <p className="text-lg font-bold">{formatStatsAmount(selectedItem.basePrice || 0).primary}</p>
                          <p className="text-sm text-muted-foreground">{formatStatsAmount(selectedItem.basePrice || 0).secondary}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Weight</Label>
                          <p className="text-sm">{selectedItem.weight}kg</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Size Class</Label>
                          <Badge variant="outline">{selectedItem.sizeClass}</Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Handling Time</Label>
                          <p className="text-sm">{selectedItem.handlingTimeDays} days</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedItem.images && selectedItem.images.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Images</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                          {selectedItem.images.map((image: string, index: number) => (
                            <img
                              key={index}
                              src={image}
                              alt={`${selectedItem.title} ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Custom Request Details */}
              {activeTab === 'requests' && (
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Request Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <p className="text-sm">{selectedItem.title}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Description</Label>
                          <p className="text-sm">{selectedItem.description}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Budget Range</Label>
                          <p className="text-sm">
                            {formatStatsAmount(selectedItem.budgetMin || 0).primary} - {formatStatsAmount(selectedItem.budgetMax || 0).primary}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Badge variant={
                            selectedItem.status === 'completed' ? 'default' :
                            selectedItem.status === 'approved' ? 'secondary' :
                            selectedItem.status === 'rejected' ? 'destructive' : 'outline'
                          }>
                            {selectedItem.status?.toUpperCase() || 'PENDING'}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Request Date</Label>
                          <p className="text-sm">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : 'N/A'}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Delivery Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Country</Label>
                          <p className="text-sm">{selectedItem.deliveryCountry}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">City</Label>
                          <p className="text-sm">{selectedItem.deliveryCity}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Target Delivery Date</Label>
                          <p className="text-sm">{selectedItem.targetDeliveryDate}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Urgency Level</Label>
                          <Badge variant={selectedItem.urgencyLevel === 'urgent' ? 'destructive' : 'outline'}>
                            {selectedItem.urgencyLevel?.toUpperCase() || 'NORMAL'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedItem.preferredBrand && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Preferences</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Preferred Brand</Label>
                          <p className="text-sm">{selectedItem.preferredBrand}</p>
                        </div>
                        {selectedItem.preferredSpecs && (
                          <div>
                            <Label className="text-sm font-medium">Preferred Specifications</Label>
                            <p className="text-sm bg-muted p-2 rounded">{selectedItem.preferredSpecs}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {selectedItem.referenceImages && selectedItem.referenceImages.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Reference Images</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                          {selectedItem.referenceImages.map((image: string, index: number) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Reference ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedItem.adminResponse && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Admin Response</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Response Status</Label>
                          <Badge variant={
                            selectedItem.adminResponse.status === 'approved' ? 'default' :
                            selectedItem.adminResponse.status === 'rejected' ? 'destructive' : 'outline'
                          }>
                            {selectedItem.adminResponse.status?.toUpperCase()}
                          </Badge>
                        </div>
                        {selectedItem.adminResponse.finalPrice && (
                          <div>
                            <Label className="text-sm font-medium">Offered Price</Label>
                            <p className="text-lg font-bold">{formatStatsAmount(selectedItem.adminResponse.finalPrice).primary}</p>
                          </div>
                        )}
                        {selectedItem.adminResponse.adminMessage && (
                          <div>
                            <Label className="text-sm font-medium">Admin Message</Label>
                            <p className="text-sm bg-muted p-2 rounded">{selectedItem.adminResponse.adminMessage}</p>
                          </div>
                        )}
                        {selectedItem.adminResponse.productImages && selectedItem.adminResponse.productImages.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Proposed Product Images</Label>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              {selectedItem.adminResponse.productImages.map((image: string, index: number) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Proposed ${index + 1}`}
                                  className="w-full h-20 object-cover rounded border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fulfillment Dialog */}
      <Dialog open={fulfillmentDialogOpen} onOpenChange={setFulfillmentDialogOpen}>
        <DialogContent className="max-w-2xl mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Fulfill Order</DialogTitle>
            <DialogDescription className="text-sm">
              Add or update tracking information and mark order as shipped
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{selectedItem.orderNumber}</h4>
                  <p className="text-sm text-muted-foreground">{selectedItem.giftTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    To: {selectedItem.recipientName} ({selectedItem.recipientPhone})
                  </p>
                </div>
                <Badge variant={
                  selectedItem.status === 'delivered' ? 'default' :
                  selectedItem.status === 'shipped' ? 'secondary' :
                  selectedItem.status === 'processing' ? 'outline' : 'outline'
                }>
                  {selectedItem.status?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Tracking Number *</Label>
                <div className="flex gap-2">
                  <Input
                    id="trackingNumber"
                    value={fulfillmentData.trackingNumber}
                    onChange={(e) => setFulfillmentData({ ...fulfillmentData, trackingNumber: e.target.value })}
                    placeholder="Enter tracking number"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFulfillmentData({ ...fulfillmentData, trackingNumber: generateTrackingNumber() })}
                    className="whitespace-nowrap"
                  >
                    Generate
                  </Button>
                </div>
                {selectedItem?.trackingNumber && fulfillmentData.trackingNumber !== selectedItem.trackingNumber && (
                  <p className="text-xs text-muted-foreground">
                    Current: {selectedItem.trackingNumber}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="courierName">Courier Name *</Label>
                <Select value={fulfillmentData.courierName} onValueChange={(value) => setFulfillmentData({ ...fulfillmentData, courierName: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select courier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DHL">DHL</SelectItem>
                    <SelectItem value="FedEx">FedEx</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="USPS">USPS</SelectItem>
                    <SelectItem value="Local Courier">Local Courier</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedDelivery">Estimated Delivery Date</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={fulfillmentData.estimatedDelivery}
                onChange={(e) => setFulfillmentData({ ...fulfillmentData, estimatedDelivery: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fulfillmentNotes">Fulfillment Notes</Label>
              <Textarea
                id="fulfillmentNotes"
                value={fulfillmentData.fulfillmentNotes}
                onChange={(e) => setFulfillmentData({ ...fulfillmentData, fulfillmentNotes: e.target.value })}
                placeholder="Add any notes about the fulfillment..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFulfillmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleFulfillOrder}
              disabled={actionLoading || !fulfillmentData.trackingNumber || !fulfillmentData.courierName}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fulfilling...
                </>
              ) : (
                'Mark as Shipped'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offer Dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="max-w-2xl mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Submit Offer</DialogTitle>
            <DialogDescription className="text-sm">
              Provide pricing and details for the custom gift request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposedPrice">Proposed Price (USD) *</Label>
                <Input
                  id="proposedPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={offerData.proposedPrice}
                  onChange={(e) => setOfferData({ ...offerData, proposedPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingFee">Shipping Fee (USD)</Label>
                <Input
                  id="shippingFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={offerData.shippingFee}
                  onChange={(e) => setOfferData({ ...offerData, shippingFee: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedDays">Estimated Delivery Days</Label>
              <Input
                id="estimatedDays"
                type="number"
                min="1"
                value={offerData.estimatedDays}
                onChange={(e) => setOfferData({ ...offerData, estimatedDays: parseInt(e.target.value) || 7 })}
                placeholder="7"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productUrl">Product URL</Label>
              <Input
                id="productUrl"
                value={offerData.productUrl}
                onChange={(e) => setOfferData({ ...offerData, productUrl: e.target.value })}
                placeholder="https://example.com/product"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="offerMessage">Message to Customer *</Label>
              <Textarea
                id="offerMessage"
                value={offerData.offerMessage}
                onChange={(e) => setOfferData({ ...offerData, offerMessage: e.target.value })}
                placeholder="Explain the offer details to the customer..."
                rows={4}
              />
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-bold">
                  {formatStatsAmount(offerData.proposedPrice + offerData.shippingFee).primary}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatStatsAmount(offerData.proposedPrice + offerData.shippingFee).secondary}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitOffer}
              disabled={actionLoading || !offerData.proposedPrice || !offerData.offerMessage}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Offer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}