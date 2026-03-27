import { useEffect, useState } from 'react';
import { adminService } from '../lib/admin-service';
import { ProductListing, ProductCategory } from '@/lib/firestore-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Edit, Trash2, Plus, Package, DollarSign, Eye, EyeOff, Save, X, Smartphone, Shield, Server, MessageSquare, Gift, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { formatStatsAmount } from '../lib/currency-utils';

export interface PriceTier {
  duration: string;
  price: number;
}
interface ProductFormData {
  name: string;
  description: string;
  category: ProductCategory;
  provider: string;
  isActive: boolean;
  stock: number;
  features: string[];
  region: string;  
  pricingTiers: PriceTier[];   
  
  // ADD THE "?" TO ALL THESE CATEGORY FIELDS
  username?: string; 
  password?: string; 
  dataAllowance?: string;
  validityPeriod?: string;
  networkType?: string;
  supportedCountries?: string[];
  activationMethod?: string;
  proxyType?: string;
  ipType?: string;
  bandwidth?: string;
  concurrentConnections?: number;
  authMethod?: string;
  osType?: string;
  ramSize?: string;
  cpuCores?: number;
  storageSize?: string;
  rdpVersion?: string;
  vpnProtocol?: string;
  deviceLimit?: number;
  logPolicy?: string;
  smsType?: string;
  deliverySpeed?: string;
  supportedNetworks?: string[];
  
  // Gift specific
  giftWeight?: number;
  giftDimensions?: {
    length: number;
    width: number;
    height: number;
  };
  sizeClass?: 'small' | 'medium' | 'large';
  isFragile?: boolean;
  handlingTimeDays?: number;
  
  tags: string[];
  imageUrl: string;
  setupInstructions?: string;
  technicalSpecs?: string;
}

export interface AdminProductListing extends ProductFormData {
  id: string;
  createdAt: any; 
  updatedAt: any;
}

// Update the helper to use the new name
type RawProductData = Partial<AdminProductListing> & { 
  createdAt?: any; 
  updatedAt?: any; 
  toDate?: () => Date 
};

// Dynamic form component for category-specific fields
function CategorySpecificFields({ category, formData, setFormData }: {
  category: ProductCategory;
  formData: any;
  setFormData: (data: any) => void;
}) {
  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateArrayField = (field: string, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData({ ...formData, [field]: items });
  };

  switch (category) {
    case 'esim':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Allowance</Label>
              <Input
                value={formData.dataAllowance}
                onChange={(e) => updateField('dataAllowance', e.target.value)}
                placeholder="e.g., 5GB, Unlimited"
              />
            </div>
            <div className="space-y-2">
              <Label>Validity Period</Label>
              <Input
                value={formData.validityPeriod}
                onChange={(e) => updateField('validityPeriod', e.target.value)}
                placeholder="e.g., 30 days, 1 year"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Network Type</Label>
              <Select value={formData.networkType} onValueChange={(value) => updateField('networkType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select network type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4G">4G</SelectItem>
                  <SelectItem value="5G">5G</SelectItem>
                  <SelectItem value="4G/5G">4G/5G</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Activation Method</Label>
              <Select value={formData.activationMethod} onValueChange={(value) => updateField('activationMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activation method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QR Code">QR Code</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="App">App</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Supported Countries (comma-separated)</Label>
           <Input
  value={(formData.supportedCountries || []).join(', ')}
  onChange={(e) => updateArrayField('supportedCountries', e.target.value)}
  placeholder="USA, UK, Germany, France"
/>
          </div>
        </div>
      );

    case 'proxy':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proxy Type</Label>
              <Select value={formData.proxyType} onValueChange={(value) => updateField('proxyType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select proxy type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HTTP">HTTP</SelectItem>
                  <SelectItem value="HTTPS">HTTPS</SelectItem>
                  <SelectItem value="SOCKS5">SOCKS5</SelectItem>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Datacenter">Datacenter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>IP Type</Label>
              <Select value={formData.ipType} onValueChange={(value) => updateField('ipType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select IP type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shared">Shared</SelectItem>
                  <SelectItem value="Dedicated">Dedicated</SelectItem>
                  <SelectItem value="Semi-Dedicated">Semi-Dedicated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bandwidth</Label>
              <Input
                value={formData.bandwidth}
                onChange={(e) => updateField('bandwidth', e.target.value)}
                placeholder="e.g., 100Mbps, Unlimited"
              />
            </div>
            <div className="space-y-2">
              <Label>Concurrent Connections</Label>
              <Input
                type="number"
                value={formData.concurrentConnections}
                onChange={(e) => updateField('concurrentConnections', parseInt(e.target.value) || 0)}
                placeholder="Number of connections"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Authentication Method</Label>
            <Select value={formData.authMethod} onValueChange={(value) => updateField('authMethod', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select auth method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Username/Password">Username/Password</SelectItem>
                <SelectItem value="IP Whitelist">IP Whitelist</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'rdp':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Operating System</Label>
              <Select value={formData.osType} onValueChange={(value) => updateField('osType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select OS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Windows Server 2019">Windows Server 2019</SelectItem>
                  <SelectItem value="Windows Server 2022">Windows Server 2022</SelectItem>
                  <SelectItem value="Windows 10">Windows 10</SelectItem>
                  <SelectItem value="Windows 11">Windows 11</SelectItem>
                  <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                  <SelectItem value="CentOS">CentOS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>RAM Size</Label>
              <Select value={formData.ramSize} onValueChange={(value) => updateField('ramSize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select RAM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2GB">2GB</SelectItem>
                  <SelectItem value="4GB">4GB</SelectItem>
                  <SelectItem value="8GB">8GB</SelectItem>
                  <SelectItem value="16GB">16GB</SelectItem>
                  <SelectItem value="32GB">32GB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CPU Cores</Label>
              <Input
                type="number"
                value={formData.cpuCores}
                onChange={(e) => updateField('cpuCores', parseInt(e.target.value) || 0)}
                placeholder="Number of CPU cores"
              />
            </div>
            <div className="space-y-2">
              <Label>Storage Size</Label>
              <Select value={formData.storageSize} onValueChange={(value) => updateField('storageSize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select storage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50GB SSD">50GB SSD</SelectItem>
                  <SelectItem value="100GB SSD">100GB SSD</SelectItem>
                  <SelectItem value="200GB SSD">200GB SSD</SelectItem>
                  <SelectItem value="500GB SSD">500GB SSD</SelectItem>
                  <SelectItem value="1TB SSD">1TB SSD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>RDP Version</Label>
            <Select value={formData.rdpVersion} onValueChange={(value) => updateField('rdpVersion', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select RDP version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RDP 10.0">RDP 10.0</SelectItem>
                <SelectItem value="RDP 8.1">RDP 8.1</SelectItem>
                <SelectItem value="RDP 8.0">RDP 8.0</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'vpn':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>VPN Protocol</Label>
              <Select value={formData.vpnProtocol} onValueChange={(value) => updateField('vpnProtocol', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OpenVPN">OpenVPN</SelectItem>
                  <SelectItem value="WireGuard">WireGuard</SelectItem>
                  <SelectItem value="IKEv2">IKEv2</SelectItem>
                  <SelectItem value="L2TP/IPSec">L2TP/IPSec</SelectItem>
                  <SelectItem value="Multiple">Multiple</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Device Limit</Label>
              <Input
                type="number"
                value={formData.deviceLimit}
                onChange={(e) => updateField('deviceLimit', parseInt(e.target.value) || 0)}
                placeholder="Number of devices"
              />
            </div>
          </div>

          
          <div className="space-y-2">
            <Label>Log Policy</Label>
            <Select value={formData.logPolicy} onValueChange={(value) => updateField('logPolicy', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select log policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="No Logs">No Logs</SelectItem>
                <SelectItem value="Connection Logs Only">Connection Logs Only</SelectItem>
                <SelectItem value="Minimal Logs">Minimal Logs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'gift':
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Gift Product Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={formData.giftWeight}
                onChange={(e) => updateField('giftWeight', parseFloat(e.target.value) || 0)}
                placeholder="0.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Size Class</Label>
              <Select value={formData.sizeClass} onValueChange={(value) => updateField('sizeClass', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Length (cm)</Label>
              <Input
                type="number"
                min="0"
                value={formData.giftDimensions.length}
                onChange={(e) => updateField('giftDimensions', { 
                  ...formData.giftDimensions, 
                  length: parseFloat(e.target.value) || 0 
                })}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label>Width (cm)</Label>
              <Input
                type="number"
                min="0"
                value={formData.giftDimensions.width}
                onChange={(e) => updateField('giftDimensions', { 
                  ...formData.giftDimensions, 
                  width: parseFloat(e.target.value) || 0 
                })}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input
                type="number"
                min="0"
                value={formData.giftDimensions.height}
                onChange={(e) => updateField('giftDimensions', { 
                  ...formData.giftDimensions, 
                  height: parseFloat(e.target.value) || 0 
                })}
                placeholder="5"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Handling Time (days)</Label>
              <Input
                type="number"
                min="1"
                value={formData.handlingTimeDays}
                onChange={(e) => updateField('handlingTimeDays', parseInt(e.target.value) || 3)}
                placeholder="3"
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                checked={formData.isFragile}
                onCheckedChange={(checked) => updateField('isFragile', checked)}
              />
              <Label>Fragile Item</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input
              value={formData.tags.join(', ')}
              onChange={(e) => updateArrayField('tags', e.target.value)}
              placeholder="electronics, gadgets, premium"
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}

export function ProductsManagement() {
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductListing | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Updated Form state for create/edit
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: 'vpn' as ProductCategory,
    provider: '',
    isActive: true,
    stock: 0,
    features: [] as string[],
    region: '',
    
    // NEW: Pricing Tiers initialization
    pricingTiers: [{ duration: '', price: 0 }], 
    
    // Service Credentials
    username: '', 
    password: '',

    // eSIM specific fields
    dataAllowance: '',
    validityPeriod: '',
    networkType: '',
    supportedCountries: [] as string[],
    activationMethod: '',

    // Proxy specific fields
    proxyType: '',
    ipType: '',
    bandwidth: '',
    concurrentConnections: 0,
    authMethod: '',

    // RDP specific fields
    osType: '',
    ramSize: '',
    cpuCores: 0,
    storageSize: '',
    rdpVersion: '',

    // VPN specific fields
    vpnProtocol: '',
    deviceLimit: 0,
    logPolicy: '',

    // SMS specific fields
    smsType: '',
    deliverySpeed: '',
    supportedNetworks: [] as string[],

    // Gift specific fields
    giftWeight: 0,
    giftDimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    sizeClass: 'medium' as 'small' | 'medium' | 'large',
    isFragile: false,
    handlingTimeDays: 3,

    // Common fields
    tags: [] as string[],
    imageUrl: '',
    setupInstructions: '',
    technicalSpecs: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

    const loadProducts = async () => {
  try {
    setLoading(true);
    const [productsData, giftsData] = await Promise.all([
      adminService.getAllProducts() as Promise<any[]>,
      adminService.getAllGifts() as Promise<any[]>
    ]);

    const sanitizedProducts = productsData.map((p): ProductListing => ({
      ...p,
      // Date Safety
      createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt || Date.now()),
      updatedAt: p.updatedAt?.toDate ? p.updatedAt.toDate() : new Date(p.updatedAt || Date.now()),
      
      // Pricing Tier Fallback
      pricingTiers: p.pricingTiers || [
        { duration: p.duration || '1 Month', price: Number(p.price) || 0 }
      ],

      // Array Fallbacks
      features: p.features || [],
      tags: p.tags || [],
      supportedCountries: p.supportedCountries || [],
      supportedNetworks: p.supportedNetworks || [],
      
      // Basic Metadata
      imageUrl: p.imageUrl || '',
      stock: Number(p.stock) || 0,
      isActive: p.isActive ?? true,
      name: p.name || '',
      category: p.category || 'vpn',
    }) as ProductListing);

    const sanitizedGifts = giftsData.map((g) => ({
      ...g,
      createdAt: g.createdAt?.toDate ? g.createdAt.toDate() : new Date(g.createdAt || Date.now()),
      tags: g.tags || [],
      features: g.features || [],
      imageUrl: g.imageUrl || '',
    }));

    setProducts(sanitizedProducts);
    setGifts(sanitizedGifts);
  } catch (error) {
    console.error('Error loading products:', error);
    toast.error('Failed to load products');
  } finally {
    setLoading(false);
  }
};

  const filteredProducts = (() => {
    if (activeTab === 'gift') {
      // Show gifts when gift tab is active
      return gifts.filter(gift => {
        const matchesSearch = gift.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          gift.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          gift.categoryId?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      }).map(gift => ({
        ...gift,
        name: gift.title,
        price: gift.basePrice,
        category: 'gift',
        provider: 'Gift Store',
        isActive: gift.isActive
      }));
    } else {
      // Show regular products
      return products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (activeTab === 'all') return matchesSearch;
        return matchesSearch && product.category === activeTab;
      });
    }
  })();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'esim': return <Smartphone className="h-4 w-4" />;
      case 'proxy': return <Shield className="h-4 w-4" />;
      case 'rdp': return <Server className="h-4 w-4" />;
      case 'vpn': return <Shield className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'gift': return <Gift className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const handleToggleActive = async (product: ProductListing) => {
    try {
      setActionLoading(true);
      await adminService.updateProduct(product.id, { isActive: !product.isActive });
      toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'} successfully`);
      
      setProducts(products.map(p => 
        p.id === product.id 
          ? { ...p, isActive: !p.isActive } 
          : p
      ));
    } catch (error) {
      console.error('Error toggling product status:', error);
      toast.error('Failed to update product status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      setActionLoading(true);
      await adminService.deleteProduct(productId);
      toast.success('Product deleted successfully');
      
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
     pricingTiers: [{ duration: '', price: 0 }], // Start with one empty tier
      category: 'vpn' as ProductCategory,
      provider: '',
      isActive: true,
      stock: 0,
      features: [],
      region: '',
      // eSIM specific fields
      dataAllowance: '',
      validityPeriod: '',
      networkType: '',
      supportedCountries: [],
      activationMethod: '',
      // Proxy specific fields
      proxyType: '',
      ipType: '',
      bandwidth: '',
      concurrentConnections: 0,
      authMethod: '',
      // RDP specific fields
      osType: '',
      ramSize: '',
      cpuCores: 0,
      storageSize: '',
      rdpVersion: '',
      // VPN specific fields
      vpnProtocol: '',
      deviceLimit: 0,
      logPolicy: '',
      // SMS specific fields
      smsType: '',
      deliverySpeed: '',
      supportedNetworks: [],
      // Gift specific fields
      giftWeight: 0,
      giftDimensions: {
        length: 0,
        width: 0,
        height: 0
      },
      sizeClass: 'medium' as 'small' | 'medium' | 'large',
      isFragile: false,
      handlingTimeDays: 3,
      tags: [] as string[],
      // Common fields
      imageUrl: '',
      setupInstructions: '',
      technicalSpecs: '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

 const openEditDialog = (product: ProductListing) => {
  // We cast to any once to avoid repetition while accessing new/old fields
  const p = product as any;
  
  setSelectedProduct(product);
  
  setFormData({
    // Basic Info
    name: p.name || '',
    description: p.description || '',
    category: p.category || 'vpn',
    provider: p.provider || '',
    isActive: p.isActive !== false,
    stock: p.stock || 0,
    region: p.region || '',
    imageUrl: p.imageUrl || '',
    setupInstructions: p.setupInstructions || '',
    technicalSpecs: p.technicalSpecs || '',

    // IMPORTANT: Fix for the "pricingTiers.some" crash
    // Converts old single price/duration to the new array format if needed
    pricingTiers: p.pricingTiers || [
      { duration: p.duration || '1 Month', price: Number(p.price) || 0 }
    ],

    // IMPORTANT: Fix for the ".join" crashes
    // Ensuring these are ALWAYS arrays, even if null/undefined in Firebase
    features: p.features || [],
    tags: p.tags || [],

    // Service Credentials
    username: p.username || '',
    password: p.password || '',

    // Category Specifics (eSIM)
    dataAllowance: p.dataAllowance || '',
    validityPeriod: p.validityPeriod || '',
    networkType: p.networkType || '',
    supportedCountries: p.supportedCountries || [],
    activationMethod: p.activationMethod || '',

    // Category Specifics (Proxy)
    proxyType: p.proxyType || '',
    ipType: p.ipType || '',
    bandwidth: p.bandwidth || '',
    concurrentConnections: Number(p.concurrentConnections) || 0,
    authMethod: p.authMethod || '',

    // Category Specifics (RDP)
    osType: p.osType || '',
    ramSize: p.ramSize || '',
    cpuCores: Number(p.cpuCores) || 0,
    storageSize: p.storageSize || '',
    rdpVersion: p.rdpVersion || '',

    // Category Specifics (VPN)
    vpnProtocol: p.vpnProtocol || '',
    deviceLimit: Number(p.deviceLimit) || 0,
    logPolicy: p.logPolicy || '',

    // Category Specifics (SMS)
    smsType: p.smsType || '',
    deliverySpeed: p.deliverySpeed || '',
    supportedNetworks: p.supportedNetworks || [],

    // Category Specifics (Gift)
    giftWeight: Number(p.giftWeight) || 0,
    giftDimensions: p.giftDimensions || { length: 0, width: 0, height: 0 },
    sizeClass: p.sizeClass || 'medium',
    isFragile: !!p.isFragile,
    handlingTimeDays: Number(p.handlingTimeDays) || 3,
  });

  setEditDialogOpen(true);
};

 const handleCreateProduct = async () => {
  try {
    setActionLoading(true);
    
    // Updated Validation: Check if name, category, provider exist 
    // AND if there is at least one valid pricing tier
    const hasValidPrice = formData.pricingTiers?.length > 0 && 
                          formData.pricingTiers.every(t => t.price > 0 && t.duration);

    if (!formData.name || !formData.category || !formData.provider || !hasValidPrice) {
      toast.error('Please fill in all required fields and ensure all pricing tiers have a price and duration');
      return;
    }

    await adminService.createProduct(formData as any);
    toast.success('Product created successfully');
    
    await loadProducts();
    setCreateDialogOpen(false);
    resetForm();
  } catch (error) {
    console.error('Error creating product:', error);
    toast.error('Failed to create product');
  } finally {
    setActionLoading(false);
  }
};

const handleUpdateProduct = async () => {
  if (!selectedProduct) return;

  try {
    setActionLoading(true);
    
    // Updated Validation: same logic as create
    const hasValidPrice = formData.pricingTiers?.length > 0 && 
                          formData.pricingTiers.every(t => t.price > 0 && t.duration);

    if (!formData.name || !formData.category || !formData.provider || !hasValidPrice) {
      toast.error('Please fill in all required fields and pricing tiers');
      return;
    }

    await adminService.updateProduct(selectedProduct.id, formData as any);
    toast.success('Product updated successfully');
    
    await loadProducts();
    setEditDialogOpen(false);
    setSelectedProduct(null);
    resetForm();
  } catch (error) {
    console.error('Error updating product:', error);
    toast.error('Failed to update product');
  } finally {
    setActionLoading(false);
  }
};

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredProducts.map(p => p.id));
      setSelectedProducts(allIds);
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkActivate = async () => {
    if (selectedProducts.size === 0) return;
    
    try {
      setBulkActionLoading(true);
      const promises = Array.from(selectedProducts).map(productId => {
        const product = filteredProducts.find(p => p.id === productId);
        if (product && activeTab !== 'gift') {
          return adminService.updateProduct(productId, { isActive: true });
        } else if (product && activeTab === 'gift') {
          return adminService.updateGift(productId, { isActive: true });
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      toast.success(`${selectedProducts.size} products activated successfully`);
      await loadProducts();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error activating products:', error);
      toast.error('Failed to activate products');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedProducts.size === 0) return;
    
    try {
      setBulkActionLoading(true);
      const promises = Array.from(selectedProducts).map(productId => {
        const product = filteredProducts.find(p => p.id === productId);
        if (product && activeTab !== 'gift') {
          return adminService.updateProduct(productId, { isActive: false });
        } else if (product && activeTab === 'gift') {
          return adminService.updateGift(productId, { isActive: false });
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      toast.success(`${selectedProducts.size} products deactivated successfully`);
      await loadProducts();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error deactivating products:', error);
      toast.error('Failed to deactivate products');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} products? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setBulkActionLoading(true);
      const promises = Array.from(selectedProducts).map(productId => {
        const product = filteredProducts.find(p => p.id === productId);
        if (product && activeTab !== 'gift') {
          return adminService.deleteProduct(productId);
        } else if (product && activeTab === 'gift') {
          return adminService.deleteGift(productId);
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      toast.success(`${selectedProducts.size} products deleted successfully`);
      await loadProducts();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error('Failed to delete products');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getProductStats = () => {
    const totalProducts = products.length + gifts.length;
    const activeProducts = products.filter(p => p.isActive).length + gifts.filter(g => g.isActive).length;
    const inactiveProducts = totalProducts - activeProducts;
    
    const allItems = [
      ...products.map(p => ({ 
        // Use the first pricing tier's price since 'price' field is gone
        price: (p.pricingTiers && p.pricingTiers[0]?.price) || 0 
      })),
      ...gifts.map(g => ({ price: (g as any).basePrice || 0 }))
    ];
    const avgPrice = allItems.reduce((sum, item) => sum + item.price, 0) / totalProducts || 0;

    return { totalProducts, activeProducts, inactiveProducts, avgPrice };
  };

  const stats = getProductStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Products Management</h1>
          <p className="text-muted-foreground">Manage product listings and inventory</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Button onClick={loadProducts} variant="outline" className="w-full sm:w-auto">
            Refresh
          </Button>
          <Button onClick={openCreateDialog} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.activeProducts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Products</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.inactiveProducts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatStatsAmount(stats.avgPrice).primary}</div>
            <div className="text-xs text-muted-foreground hidden sm:block">{formatStatsAmount(stats.avgPrice).secondary}</div>
          </CardContent>
        </Card>
      </div>

  {/* Create Product Dialog */}
<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Create New Product</DialogTitle>
      <DialogDescription>
        Add a new product with multiple duration and pricing options
      </DialogDescription>
    </DialogHeader>
    
    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
        
        {/* NEW: Image URL Field */}
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Product Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="imageUrl"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.png"
            />
            {formData.imageUrl && (
              <div className="h-10 w-10 rounded border bg-muted flex-shrink-0 overflow-hidden">
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.src = 'https://placehold.co/40x40?text=!')}
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Premium VPN Service"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vpn">VPN</SelectItem>
                <SelectItem value="esim">eSIM</SelectItem>
                <SelectItem value="rdp">RDP</SelectItem>
                <SelectItem value="proxy">Proxy</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="gift">Gift</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider *</Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="e.g. NordVPN, ExpressVPN"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region/Country</Label>
            <Input
              id="region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              placeholder="e.g. Global, USA"
            />
          </div>
        </div>

        {/* Dynamic Pricing Tiers Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Pricing & Durations *</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setFormData({
                ...formData, 
                pricingTiers: [...(formData.pricingTiers || []), { duration: '', price: 0 }]
              })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Tier
            </Button>
          </div>
          
          {(formData.pricingTiers || []).map((tier, index) => (
            <div key={index} className="flex gap-4 items-end animate-in fade-in slide-in-from-top-1">
              <div className="flex-1 space-y-2">
                <Label className="text-xs text-muted-foreground">Duration</Label>
                <Input
                  placeholder="e.g. 1 Month"
                  value={tier.duration}
                  onChange={(e) => {
                    const newTiers = [...(formData.pricingTiers || [])];
                    newTiers[index].duration = e.target.value;
                    setFormData({ ...formData, pricingTiers: newTiers });
                  }}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-xs text-muted-foreground">Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={tier.price}
                  onChange={(e) => {
                    const newTiers = [...(formData.pricingTiers || [])];
                    newTiers[index].price = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, pricingTiers: newTiers });
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-10 w-10"
                disabled={(formData.pricingTiers || []).length <= 1}
                onClick={() => {
                  const newTiers = formData.pricingTiers.filter((_, i) => i !== index);
                  setFormData({ ...formData, pricingTiers: newTiers });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Credentials Section */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="username">Service Username</Label>
            <Input
              id="username"
              value={formData.username || ''}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Login ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Service Password</Label>
            <Input
              id="password"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Login Password"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Key highlights of this service"
            rows={2}
          />
        </div>
      </div>

      {/* Category-Specific Fields */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">{formData.category.toUpperCase()} Configuration</h3>
        <CategorySpecificFields 
          category={formData.category} 
          formData={formData as any} 
          setFormData={setFormData} 
        />
      </div>

      {/* Setup & Inventory */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Inventory & Visibility</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stock">Available Stock</Label>
            <Input
              id="stock"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center space-x-2 pt-8">
            <Switch
              id="active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="active">Live in Shop</Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="setupInstructions">Quick Setup Guide</Label>
          <Textarea
            id="setupInstructions"
            value={formData.setupInstructions}
            onChange={(e) => setFormData({ ...formData, setupInstructions: e.target.value })}
            placeholder="Instructions sent to the user after purchase"
            rows={2}
          />
        </div>
      </div>
    </div>

    <DialogFooter className="border-t pt-4">
      <Button
        variant="outline"
        onClick={() => setCreateDialogOpen(false)}
        disabled={actionLoading}
      >
        <X className="mr-2 h-4 w-4" /> Cancel
      </Button>
      <Button
        onClick={handleCreateProduct}
        disabled={
          actionLoading || 
          !formData.name || 
          (formData.pricingTiers || []).some(t => !t.duration || t.price <= 0)
        }
      >
        {actionLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" /> Save Product
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
{/* Edit Product Dialog */}
<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Edit Product</DialogTitle>
      <DialogDescription>
        Update product information, credentials, and pricing tiers
      </DialogDescription>
    </DialogHeader>
    
    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
        
        {/* Image URL Field with Preview */}
        <div className="space-y-2">
          <Label htmlFor="edit-imageUrl">Product Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="edit-imageUrl"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.png"
            />
            {formData.imageUrl && (
              <div className="h-10 w-10 rounded border bg-muted flex-shrink-0 overflow-hidden">
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.src = 'https://placehold.co/40x40?text=!')}
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Product Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}>
              <SelectTrigger id="edit-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vpn">VPN</SelectItem>
                <SelectItem value="esim">eSIM</SelectItem>
                <SelectItem value="rdp">RDP</SelectItem>
                <SelectItem value="proxy">Proxy</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="gift">Gift</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-provider">Provider *</Label>
            <Input
              id="edit-provider"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-region">Region</Label>
            <Input
              id="edit-region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            />
          </div>
        </div>

        {/* Dynamic Pricing Tiers Section */}
        <div className="space-y-4 pt-4 border-t mt-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Pricing & Durations *</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setFormData({
                ...formData, 
                pricingTiers: [...(formData.pricingTiers || []), { duration: '', price: 0 }]
              })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Tier
            </Button>
          </div>
          
          {(formData.pricingTiers || []).map((tier, index) => (
            <div key={index} className="flex gap-4 items-end bg-muted/20 p-2 rounded-md animate-in fade-in">
              <div className="flex-1 space-y-2">
                <Label className="text-xs">Duration</Label>
                <Input
                  placeholder="e.g. 1 Month"
                  value={tier.duration}
                  onChange={(e) => {
                    const newTiers = [...(formData.pricingTiers || [])];
                    newTiers[index].duration = e.target.value;
                    setFormData({ ...formData, pricingTiers: newTiers });
                  }}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-xs">Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tier.price}
                  onChange={(e) => {
                    const newTiers = [...(formData.pricingTiers || [])];
                    newTiers[index].price = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, pricingTiers: newTiers });
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                disabled={(formData.pricingTiers || []).length <= 1}
                onClick={() => {
                  const newTiers = formData.pricingTiers.filter((_, i) => i !== index);
                  setFormData({ ...formData, pricingTiers: newTiers });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Credentials Section */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="edit-username">Service Username</Label>
            <Input
              id="edit-username"
              value={formData.username || ''}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Account Email/ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-password">Service Password</Label>
            <Input
              id="edit-password"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Account Password"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      {/* Category-Specific Fields */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">{formData.category?.toUpperCase()} Configuration</h3>
        <CategorySpecificFields 
          category={formData.category} 
          formData={formData as any} 
          setFormData={setFormData} 
        />
      </div>

      {/* Inventory & Setup */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Inventory & Visibility</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-stock">Available Stock</Label>
            <Input
              id="edit-stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center space-x-2 pt-8">
            <Switch
              id="edit-active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="edit-active">Product is Visible</Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-setupInstructions">Setup Instructions</Label>
          <Textarea
            id="edit-setupInstructions"
            value={formData.setupInstructions}
            onChange={(e) => setFormData({ ...formData, setupInstructions: e.target.value })}
            rows={2}
          />
        </div>
      </div>
    </div>

    <DialogFooter className="border-t pt-4">
      <Button
        variant="outline"
        onClick={() => setEditDialogOpen(false)}
        disabled={actionLoading}
      >
        <X className="mr-2 h-4 w-4" /> Cancel
      </Button>
      <Button
        onClick={handleUpdateProduct}
        disabled={actionLoading || (formData.pricingTiers || []).some(t => !t.duration || t.price <= 0)}
      >
        {actionLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" /> Update Product
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </div>
  );
}
