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
import { Loader2, Search, Edit, CheckCircle, Clock, Package, Smartphone, Shield, Server, MessageSquare, Eye, X, Save, Copy, FileText, ShoppingCart, User, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { formatStatsAmount } from '../lib/currency-utils';
import { generateOrderStatusEmail, openGmailWithTemplate, openSimpleGmailCompose } from '../lib/email-templates';

// Helper function to safely format dates
const formatOrderDate = (dateValue: any, formatString: string = "MMM dd, yyyy"): string => {
  try {
    if (!dateValue) return 'N/A';
    
    let date: Date;
    
    // Handle Firestore Timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    }
    // Handle Date object
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Handle timestamp number
    else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    }
    // Handle string dates
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    }
    else {
      return 'N/A';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    // Use native formatting to avoid import issues
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'N/A';
  }
};

// Email template generator - moved to email-templates.ts

interface ProductOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  productId: string;
  productName: string;
  category: 'esim' | 'proxy' | 'rdp' | 'vpn' | 'sms';
  provider?: string;
  quantity?: number;
  price: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  adminNotes?: string;
  fulfillmentData?: any;
  requestDetails?: {
    location?: string;
    duration?: string;
    specifications?: string;
    additionalNotes?: string;
  };
}

// Edit Fulfillment form component for updating existing fulfillment data
function EditFulfillmentForm({ order, onSubmit, loading }: {
  order: ProductOrder;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<any>(order.fulfillmentData || {});

  const handleSubmit = () => {
    onSubmit(formData);
  };

  switch (order.category) {
    case 'esim':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Edit eSIM Fulfillment Data</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>QR Code Image URL *</Label>
              <Input
                value={formData.qrCodeUrl || ''}
                onChange={(e) => setFormData({ ...formData, qrCodeUrl: e.target.value })}
                placeholder="https://example.com/qr-code.png"
              />
            </div>
            <div className="space-y-2">
              <Label>Activation Code *</Label>
              <Input
                value={formData.activationCode || ''}
                onChange={(e) => setFormData({ ...formData, activationCode: e.target.value })}
                placeholder="Enter activation code"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ICCID</Label>
              <Input
                value={formData.iccid || ''}
                onChange={(e) => setFormData({ ...formData, iccid: e.target.value })}
                placeholder="Enter ICCID"
              />
            </div>
            <div className="space-y-2">
              <Label>PIN/PUK</Label>
              <Input
                value={formData.pin || ''}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="Enter PIN/PUK"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Setup Instructions</Label>
            <Textarea
              value={formData.instructions || ''}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Step-by-step setup instructions"
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Validity Period</Label>
            <Input
              value={formData.validityPeriod || ''}
              onChange={(e) => setFormData({ ...formData, validityPeriod: e.target.value })}
              placeholder="e.g., 30 days from activation"
            />
          </div>
          
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Update eSIM Data
          </Button>
        </div>
      );

    case 'rdp':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Edit RDP Fulfillment Data</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Server IP Address *</Label>
              <Input
                value={formData.serverIp || ''}
                onChange={(e) => setFormData({ ...formData, serverIp: e.target.value })}
                placeholder="192.168.1.100"
              />
            </div>
            <div className="space-y-2">
              <Label>RDP Port *</Label>
              <Input
                value={formData.rdpPort || '3389'}
                onChange={(e) => setFormData({ ...formData, rdpPort: e.target.value })}
                placeholder="3389"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={formData.username || ''}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Operating System</Label>
              <Input
                value={formData.operatingSystem || ''}
                onChange={(e) => setFormData({ ...formData, operatingSystem: e.target.value })}
                placeholder="Windows Server 2019"
              />
            </div>
            <div className="space-y-2">
              <Label>Server Location</Label>
              <Input
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., USA, Germany"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Connection Instructions</Label>
            <Textarea
              value={formData.instructions || ''}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="How to connect to the RDP server"
              rows={4}
            />
          </div>
          
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Update RDP Data
          </Button>
        </div>
      );

    case 'proxy':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Edit Proxy Fulfillment Data</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proxy IP Address *</Label>
              <Input
                value={formData.ipAddress || ''}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                placeholder="192.168.1.1"
              />
            </div>
            <div className="space-y-2">
              <Label>Port *</Label>
              <Input
                value={formData.port || ''}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                placeholder="8080"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={formData.username || ''}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Usage Instructions</Label>
            <Textarea
              value={formData.instructions || ''}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="How to configure and use the proxy"
              rows={4}
            />
          </div>
          
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Update Proxy Data
          </Button>
        </div>
      );

    case 'vpn':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Edit VPN Fulfillment Data</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Username *</Label>
              <Input
                value={formData.username || ''}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter VPN username"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Password *</Label>
              <Input
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter VPN password"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Server Address</Label>
              <Input
                value={formData.serverAddress || ''}
                onChange={(e) => setFormData({ ...formData, serverAddress: e.target.value })}
                placeholder="vpn.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Configuration File URL</Label>
              <Input
                value={formData.configFileUrl || ''}
                onChange={(e) => setFormData({ ...formData, configFileUrl: e.target.value })}
                placeholder="https://example.com/config.ovpn"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Setup Instructions</Label>
            <Textarea
              value={formData.instructions || ''}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="How to setup and use the VPN"
              rows={4}
            />
          </div>
          
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Update VPN Data
          </Button>
        </div>
      );

    default:
      return <div>Edit form not available for this product type.</div>;
  }
}

// Fulfillment form component for different product types
function FulfillmentForm({ order, onSubmit, loading }: {
  order: ProductOrder;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = () => {
    onSubmit(formData);
  };

  switch (order.category) {
    case 'esim':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">eSIM Fulfillment Data</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>QR Code Image URL *</Label>
              <Input
                value={formData.qrCodeUrl || ''}
                onChange={(e) => setFormData({ ...formData, qrCodeUrl: e.target.value })}
                placeholder="https://example.com/qr-code.png"
              />
            </div>
            <div className="space-y-2">
              <Label>Activation Code *</Label>
              <Input
                value={formData.activationCode || ''}
                onChange={(e) => setFormData({ ...formData, activationCode: e.target.value })}
                placeholder="Enter activation code"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ICCID</Label>
              <Input
                value={formData.iccid || ''}
                onChange={(e) => setFormData({ ...formData, iccid: e.target.value })}
                placeholder="Enter ICCID"
              />
            </div>
            <div className="space-y-2">
              <Label>PIN/PUK</Label>
              <Input
                value={formData.pin || ''}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="Enter PIN/PUK"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Setup Instructions</Label>
            <Textarea
              value={formData.instructions || ''}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Step-by-step setup instructions"
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Validity Period</Label>
            <Input
              value={formData.validityPeriod || ''}
              onChange={(e) => setFormData({ ...formData, validityPeriod: e.target.value })}
              placeholder="e.g., 30 days from activation"
            />
          </div>
          
          <Button onClick={handleSubmit} disabled={loading || !formData.qrCodeUrl || !formData.activationCode}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Fulfill eSIM Order
          </Button>
        </div>
      );

    case 'proxy':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Proxy Fulfillment Data</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proxy IP Address *</Label>
              <Input
                value={formData.ipAddress || ''}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                placeholder="192.168.1.1"
              />
            </div>
            <div className="space-y-2">
              <Label>Port *</Label>
              <Input
                value={formData.port || ''}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                placeholder="8080"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={formData.username || ''}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Protocol</Label>
              <Select value={formData.protocol || ''} onValueChange={(value) => setFormData({ ...formData, protocol: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HTTP">HTTP</SelectItem>
                  <SelectItem value="HTTPS">HTTPS</SelectItem>
                  <SelectItem value="SOCKS5">SOCKS5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., USA, UK"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Usage Instructions</Label>
            <Textarea
              value={formData.instructions || ''}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="How to configure and use the proxy"
              rows={4}
            />
          </div>
          
          <Button onClick={handleSubmit} disabled={loading || !formData.ipAddress || !formData.port || !formData.username || !formData.password}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Fulfill Proxy Order
          </Button>
        </div>
      );

    case 'rdp':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">RDP Fulfillment Data</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Server IP Address *</Label>
              <Input
                value={formData.serverIp || ''}
                onChange={(e) => setFormData({ ...formData, serverIp: e.target.value })}
                placeholder="192.168.1.100"
              />
            </div>
            <div className="space-y-2">
              <Label>RDP Port *</Label>
              <Input
                value={formData.rdpPort || '3389'}
                onChange={(e) => setFormData({ ...formData, rdpPort: e.target.value })}
                placeholder="3389"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={formData.username || ''}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Operating System</Label>
              <Input
                value={formData.operatingSystem || ''}
                onChange={(e) => setFormData({ ...formData, operatingSystem: e.target.value })}
                placeholder="Windows Server 2019"
              />
            </div>
            <div className="space-y-2">
              <Label>Server Location</Label>
              <Input
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., USA, Germany"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Server Specifications</Label>
            <Textarea
              value={formData.specifications || ''}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              placeholder="RAM, CPU, Storage details"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Connection Instructions</Label>
            <Textarea
              value={formData.instructions || ''}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="How to connect to the RDP server"
              rows={4}
            />
          </div>
          
          <Button onClick={handleSubmit} disabled={loading || !formData.serverIp || !formData.username || !formData.password}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Fulfill RDP Order
          </Button>
        </div>
      );

    case 'vpn':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">VPN Fulfillment Data</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Username *</Label>
              <Input
                value={formData.username || ''}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter VPN username"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Password *</Label>
              <Input
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter VPN password"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Server Address</Label>
              <Input
                value={formData.serverAddress || ''}
                onChange={(e) => setFormData({ ...formData, serverAddress: e.target.value })}
                placeholder="vpn.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Protocol</Label>
              <Select value={formData.protocol || ''} onValueChange={(value) => setFormData({ ...formData, protocol: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OpenVPN">OpenVPN</SelectItem>
                  <SelectItem value="WireGuard">WireGuard</SelectItem>
                  <SelectItem value="IKEv2">IKEv2</SelectItem>
                  <SelectItem value="L2TP">L2TP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Configuration File URL</Label>
            <Input
              value={formData.configFileUrl || ''}
              onChange={(e) => setFormData({ ...formData, configFileUrl: e.target.value })}
              placeholder="https://example.com/config.ovpn"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Setup Instructions</Label>
            <Textarea
              value={formData.instructions || ''}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="How to setup and use the VPN"
              rows={4}
            />
          </div>
          
          <Button onClick={handleSubmit} disabled={loading || !formData.username || !formData.password}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Fulfill VPN Order
          </Button>
        </div>
      );

    case 'sms':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">SMS Service - Automated</h3>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              SMS services are automatically provisioned via API. No manual fulfillment required.
              The service is activated immediately upon payment confirmation.
            </p>
          </div>
          
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Mark as Auto-Fulfilled
          </Button>
        </div>
      );

    default:
      return <div>Fulfillment form not available for this product type.</div>;
  }
}

export function OrdersManagement() {
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFulfillmentDialogOpen, setEditFulfillmentDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  
  // Form state for status update
  const [statusForm, setStatusForm] = useState({
    status: '',
    adminNotes: ''
  });

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await adminService.getAllOrders();
      setOrders(ordersData as ProductOrder[]);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && order.category === activeTab;
  });

  const getOrderStats = () => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.amount || o.price || 0), 0);

    return { totalOrders, pendingOrders, processingOrders, completedOrders, totalRevenue };
  };

  const stats = getOrderStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'esim': return <Smartphone className="h-4 w-4" />;
      case 'proxy': return <Shield className="h-4 w-4" />;
      case 'rdp': return <Server className="h-4 w-4" />;
      case 'vpn': return <Shield className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled':
      case 'refunded': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'outline';
      case 'failed':
      case 'refunded': return 'destructive';
      default: return 'secondary';
    }
  };

  const openDetailsDialog = (order: ProductOrder) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const openStatusDialog = (order: ProductOrder) => {
    setSelectedOrder(order);
    setStatusForm({
      status: order.status,
      adminNotes: order.adminNotes || ''
    });
    setStatusDialogOpen(true);
  };

  const openFulfillmentDialog = (order: ProductOrder) => {
    setSelectedOrder(order);
    setFulfillmentDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      setActionLoading(true);
      await adminService.updateOrderStatus(selectedOrder.id, statusForm.status, statusForm.adminNotes);
      toast.success('Order status updated successfully');
      
      // Update local state
      setOrders(orders => orders.map(o => 
        o.id === selectedOrder.id 
          ? { ...o, status: statusForm.status as any, adminNotes: statusForm.adminNotes }
          : o
      ));
      
      setStatusDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfillOrder = async (fulfillmentData: any) => {
    if (!selectedOrder) return;

    try {
      setActionLoading(true);
      
      // Update order with fulfillment data and mark as completed
      await adminService.updateOrderFulfillment(selectedOrder.id, fulfillmentData);
      
      toast.success('Order fulfilled successfully');
      
      // Update local state
      setOrders(orders => orders.map(o => 
        o.id === selectedOrder.id 
          ? { 
              ...o, 
              status: 'completed', 
              fulfillmentData, 
              adminNotes: 'Order fulfilled with product data',
              completedAt: new Date(),
              updatedAt: new Date()
            }
          : o
      ));
      
      setFulfillmentDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error fulfilling order:', error);
      toast.error('Failed to fulfill order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateFulfillment = async (fulfillmentData: any) => {
    if (!selectedOrder) return;

    try {
      setActionLoading(true);
      
      // Update order with new fulfillment data (without changing status)
      await adminService.updateFulfillmentDataOnly(selectedOrder.id, fulfillmentData);
      
      toast.success('Fulfillment data updated successfully');
      
      // Update local state
      setOrders(orders => orders.map(o => 
        o.id === selectedOrder.id 
          ? { 
              ...o, 
              fulfillmentData, 
              updatedAt: new Date()
            }
          : o
      ));
      
      setEditFulfillmentDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating fulfillment data:', error);
      toast.error('Failed to update fulfillment data');
    } finally {
      setActionLoading(false);
    }
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
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage product orders and fulfillment</p>
        </div>
        <Button onClick={loadOrders} variant="outline" className="w-full sm:w-auto">
          Refresh
        </Button>
      </div>

      {/* Stats Cards - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{stats.pendingOrders}</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Processing</CardTitle>
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{stats.processingOrders}</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{stats.completedOrders}</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Revenue</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{formatStatsAmount(stats.totalRevenue).primary}</div>
            <div className="text-xs text-muted-foreground">{formatStatsAmount(stats.totalRevenue).secondary}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search - Mobile Responsive */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Order Search</CardTitle>
          <CardDescription className="text-sm">Search orders by order number, user email, or product name</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders by Category - Mobile Responsive */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Orders by Category</CardTitle>
          <CardDescription className="text-sm">Manage orders by product type</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Mobile: Scrollable tabs */}
            <div className="overflow-x-auto">
              <TabsList className="grid w-max grid-cols-5 min-w-full sm:w-full">
                <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-4">All Orders</TabsTrigger>
                <TabsTrigger value="esim" className="text-xs sm:text-sm px-2 sm:px-4">eSIM</TabsTrigger>
                <TabsTrigger value="proxy" className="text-xs sm:text-sm px-2 sm:px-4">Proxy</TabsTrigger>
                <TabsTrigger value="rdp" className="text-xs sm:text-sm px-2 sm:px-4">RDP</TabsTrigger>
                <TabsTrigger value="vpn" className="text-xs sm:text-sm px-2 sm:px-4">VPN</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={activeTab} className="mt-4">
              {isMobile ? (
                // Mobile: Card-based layout
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="p-4">
                      <div className="space-y-3">
                        {/* Order Header */}
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{order.orderNumber}</div>
                            <div className="text-xs text-muted-foreground flex items-center mt-1">
                              {getCategoryIcon(order.category)}
                              <span className="ml-1">{order.category.toUpperCase()}</span>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(order.status)} text-xs flex-shrink-0 ml-2`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-1">
                          <div className="font-medium text-sm truncate">{order.productName}</div>
                          <div className="text-xs text-muted-foreground">{order.provider}</div>
                          <div className="text-xs text-muted-foreground truncate">{order.userEmail}</div>
                        </div>

                        {/* Amount and Date */}
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <div className="font-medium">{formatStatsAmount(order.amount || order.price || 0).primary}</div>
                            <div className="text-muted-foreground">{formatStatsAmount(order.amount || order.price || 0).secondary}</div>
                          </div>
                          <div className="text-muted-foreground">
                            {formatOrderDate(order.createdAt)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetailsDialog(order)}
                            className="flex-1 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openStatusDialog(order)}
                            className="flex-1 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {(order.status === 'pending' || order.status === 'processing') && order.category !== 'sms' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openFulfillmentDialog(order)}
                              className="flex-1 text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Fulfill
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              openSimpleGmailCompose(
                                order.userEmail, 
                                order.orderNumber || order.id.slice(-8), 
                                order.status, 
                                order.productName,
                                order.fulfillmentData
                              );
                              toast.success(`${order.status} email opened in Gmail`);
                            }}
                            className="flex-1 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                            </svg>
                            Email
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {filteredOrders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No orders found matching your criteria.
                    </div>
                  )}
                </div>
              ) : (
                // Desktop: Table layout
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Order</TableHead>
                          <TableHead className="min-w-[150px]">Product</TableHead>
                          <TableHead className="min-w-[120px]">Customer</TableHead>
                          <TableHead className="min-w-[100px]">Amount</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[100px]">Date</TableHead>
                          <TableHead className="min-w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.orderNumber}</div>
                                <div className="text-sm text-muted-foreground flex items-center">
                                  {getCategoryIcon(order.category)}
                                  <span className="ml-1">{order.category.toUpperCase()}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.productName}</div>
                                <div className="text-sm text-muted-foreground">{order.provider}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{order.userEmail}</div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{formatStatsAmount(order.amount || order.price || 0).primary}</div>
                                <div className="text-xs text-muted-foreground">{formatStatsAmount(order.amount || order.price || 0).secondary}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatOrderDate(order.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDetailsDialog(order)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openStatusDialog(order)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                {(order.status === 'pending' || order.status === 'processing') && order.category !== 'sms' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => openFulfillmentDialog(order)}
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    openSimpleGmailCompose(
                                      order.userEmail, 
                                      order.orderNumber || order.id.slice(-8), 
                                      order.status, 
                                      order.productName,
                                      order.fulfillmentData
                                    );
                                    toast.success(`${order.status} email opened in Gmail`);
                                  }}
                                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                  title={`Send ${order.status} email`}
                                >
                                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                  </svg>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredOrders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No orders found matching your criteria.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              Complete information for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="grid gap-6 py-4">
              {/* Status and Actions Bar */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant={getStatusVariant(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                  <Badge variant={getPaymentStatusVariant(selectedOrder.paymentStatus)}>
                    {selectedOrder.paymentStatus}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.orderNumber);
                      toast.success('Order number copied to clipboard');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Order #
                  </Button>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Order Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Order Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="font-medium text-gray-600">Order #:</span>
                        <span className="font-mono">{selectedOrder.orderNumber}</span>
                        
                        <span className="font-medium text-gray-600">Category:</span>
                        <span className="capitalize">{selectedOrder.category}</span>
                        
                        <span className="font-medium text-gray-600">Status:</span>
                        <Badge variant={getStatusVariant(selectedOrder.status)} className="w-fit">
                          {selectedOrder.status}
                        </Badge>
                        
                        <span className="font-medium text-gray-600">Payment:</span>
                        <Badge variant={getPaymentStatusVariant(selectedOrder.paymentStatus)} className="w-fit">
                          {selectedOrder.paymentStatus}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Product Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Product Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="font-medium text-gray-600">Product:</span>
                        <span>{selectedOrder.productName}</span>
                        
                        <span className="font-medium text-gray-600">Provider:</span>
                        <span>{selectedOrder.provider}</span>
                        
                        <span className="font-medium text-gray-600">Quantity:</span>
                        <span>{selectedOrder.quantity}</span>
                        
                        <span className="font-medium text-gray-600">Unit Price:</span>
                        <span className="font-mono">{formatStatsAmount(selectedOrder.price).primary}</span>
                        
                        <span className="font-medium text-gray-600">Total Amount:</span>
                        <span className="font-mono font-semibold text-green-600">
                          {formatStatsAmount(selectedOrder.amount || selectedOrder.price || 0).primary}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="font-medium text-gray-600">Email:</span>
                        <span>{selectedOrder.userEmail}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Created:</span>
                          <span>{formatOrderDate(selectedOrder.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Last Updated:</span>
                          <span>{formatOrderDate(selectedOrder.updatedAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Admin Notes */}
                  {selectedOrder.adminNotes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Admin Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm p-3 bg-blue-50 rounded-md border-l-4 border-blue-200">
                          {selectedOrder.adminNotes}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Fulfillment Data */}
                  {selectedOrder.fulfillmentData && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Fulfillment Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Category-specific display */}
                          {selectedOrder.category === 'esim' && (
                            <div className="grid grid-cols-2 gap-4">
                              {selectedOrder.fulfillmentData.qrCodeUrl && (
                                <div>
                                  <label className="text-sm font-medium">QR Code URL:</label>
                                  <p className="text-sm text-blue-600 break-all">{selectedOrder.fulfillmentData.qrCodeUrl}</p>
                                </div>
                              )}
                              {selectedOrder.fulfillmentData.activationCode && (
                                <div>
                                  <label className="text-sm font-medium">Activation Code:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.activationCode}</p>
                                </div>
                              )}
                              {selectedOrder.fulfillmentData.iccid && (
                                <div>
                                  <label className="text-sm font-medium">ICCID:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.iccid}</p>
                                </div>
                              )}
                              {selectedOrder.fulfillmentData.pin && (
                                <div>
                                  <label className="text-sm font-medium">PIN/PUK:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.pin}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {selectedOrder.category === 'rdp' && (
                            <div className="grid grid-cols-2 gap-4">
                              {selectedOrder.fulfillmentData.serverIp && (
                                <div>
                                  <label className="text-sm font-medium">Server IP:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.serverIp}</p>
                                </div>
                              )}
                              {selectedOrder.fulfillmentData.rdpPort && (
                                <div>
                                  <label className="text-sm font-medium">RDP Port:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.rdpPort}</p>
                                </div>
                              )}
                              {selectedOrder.fulfillmentData.username && (
                                <div>
                                  <label className="text-sm font-medium">Username:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.username}</p>
                                </div>
                              )}
                              {selectedOrder.fulfillmentData.password && (
                                <div>
                                  <label className="text-sm font-medium">Password:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.password}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {selectedOrder.category === 'proxy' && (
                            <div className="grid grid-cols-2 gap-4">
                              {selectedOrder.fulfillmentData.ipAddress && (
                                <div>
                                  <label className="text-sm font-medium">Proxy IP:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.ipAddress}</p>
                                </div>
                              )}
                              {selectedOrder.fulfillmentData.port && (
                                <div>
                                  <label className="text-sm font-medium">Port:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.port}</p>
                                </div>
                              )}
                              {selectedOrder.fulfillmentData.username && (
                                <div>
                                  <label className="text-sm font-medium">Username:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.username}</p>
                                </div>
                              )}
                              {selectedOrder.fulfillmentData.password && (
                                <div>
                                  <label className="text-sm font-medium">Password:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.password}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {selectedOrder.category === 'vpn' && (
                            <div className="grid grid-cols-2 gap-4">
                              {selectedOrder.fulfillmentData.username && (
                                <div>
                                  <label className="text-sm font-medium">VPN Username:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.username}</p>
                                </div>
                              )}
                              {selectedOrder.fulfillmentData.password && (
                                <div>
                                  <label className="text-sm font-medium">VPN Password:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.password}</p>
                                </div>
                              )}
                              {selectedOrder.fulfillmentData.serverAddress && (
                                <div>
                                  <label className="text-sm font-medium">Server Address:</label>
                                  <p className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedOrder.fulfillmentData.serverAddress}</p>
                                </div>
                              )}
                              {selectedOrder.fulfillmentData.configFileUrl && (
                                <div>
                                  <label className="text-sm font-medium">Config File:</label>
                                  <p className="text-sm text-blue-600 break-all">{selectedOrder.fulfillmentData.configFileUrl}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {selectedOrder.fulfillmentData.instructions && (
                            <div>
                              <label className="text-sm font-medium">Setup Instructions:</label>
                              <div className="text-sm p-3 bg-gray-50 rounded-md mt-1 whitespace-pre-wrap">
                                {selectedOrder.fulfillmentData.instructions}
                              </div>
                            </div>
                          )}

                          {/* Raw JSON fallback */}
                          <details className="mt-4">
                            <summary className="text-sm font-medium cursor-pointer">View Raw Data</summary>
                            <div className="text-xs p-3 bg-gray-50 rounded-md border mt-2 overflow-x-auto">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(selectedOrder.fulfillmentData, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {selectedOrder && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(selectedOrder);
                      setEditDialogOpen(true);
                      setDetailsDialogOpen(false);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Order
                  </Button>
                  {selectedOrder.fulfillmentData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(selectedOrder);
                        setEditFulfillmentDialogOpen(true);
                        setDetailsDialogOpen(false);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Edit Fulfillment
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(selectedOrder);
                      setNotesDialogOpen(true);
                      setDetailsDialogOpen(false);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Add Notes
                  </Button>
                  {/* Send Mail Button - Available for all orders */}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      openSimpleGmailCompose(
                        selectedOrder.userEmail, 
                        selectedOrder.orderNumber || selectedOrder.id.slice(-8), 
                        selectedOrder.status, 
                        selectedOrder.productName,
                        selectedOrder.fulfillmentData
                      );
                      toast.success(`${selectedOrder.status} email opened in Gmail`);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    Send {selectedOrder.status === 'pending' ? 'Confirmation' : selectedOrder.status === 'processing' ? 'Update' : 'Completion'} Email
                  </Button>
                </>
              )}
            </div>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusForm.status} onValueChange={(value) => setStatusForm({ ...statusForm, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                value={statusForm.adminNotes}
                onChange={(e) => setStatusForm({ ...statusForm, adminNotes: e.target.value })}
                placeholder="Add notes about this status update..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={actionLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fulfillment Dialog */}
      <Dialog open={fulfillmentDialogOpen} onOpenChange={setFulfillmentDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Fulfill Order</DialogTitle>
            <DialogDescription>
              Provide the product data for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {selectedOrder && (
              <FulfillmentForm
                order={selectedOrder}
                onSubmit={handleFulfillOrder}
                loading={actionLoading}
              />
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFulfillmentDialogOpen(false)}
              disabled={actionLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Fulfillment Dialog */}
      <Dialog open={editFulfillmentDialogOpen} onOpenChange={setEditFulfillmentDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Fulfillment Data</DialogTitle>
            <DialogDescription>
              Update the fulfillment data for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {selectedOrder && (
              <EditFulfillmentForm
                order={selectedOrder}
                onSubmit={handleUpdateFulfillment}
                loading={actionLoading}
              />
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditFulfillmentDialogOpen(false)}
              disabled={actionLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}