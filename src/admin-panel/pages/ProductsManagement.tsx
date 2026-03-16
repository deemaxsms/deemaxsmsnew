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

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  provider: string;
  isActive: boolean;
  stock: number;
  features: string[];
  duration: string;
  region: string;
  // eSIM specific fields
  dataAllowance: string;
  validityPeriod: string;
  networkType: string;
  supportedCountries: string[];
  activationMethod: string;
  // Proxy specific fields
  proxyType: string;
  ipType: string;
  bandwidth: string;
  concurrentConnections: number;
  authMethod: string;
  // RDP specific fields
  osType: string;
  ramSize: string;
  cpuCores: number;
  storageSize: string;
  rdpVersion: string;
  // VPN specific fields
  vpnProtocol: string;
  serverLocations: string[];
  deviceLimit: number;
  logPolicy: string;
  // SMS specific fields
  smsType: string;
  deliverySpeed: string;
  supportedNetworks: string[];
  // Gift specific fields
  giftWeight: number;
  giftDimensions: {
    length: number;
    width: number;
    height: number;
  };
  sizeClass: 'small' | 'medium' | 'large';
  isFragile: boolean;
  handlingTimeDays: number;
  tags: string[];
  // Common fields
  imageUrl: string;
  setupInstructions: string;
  technicalSpecs: string;
}

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
              value={formData.supportedCountries.join(', ')}
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
            <Label>Server Locations (comma-separated)</Label>
            <Input
              value={formData.serverLocations.join(', ')}
              onChange={(e) => updateArrayField('serverLocations', e.target.value)}
              placeholder="USA, UK, Germany, Japan"
            />
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
  
  // Form state for create/edit
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    category: 'vpn' as ProductCategory,
    provider: '',
    isActive: true,
    stock: 0,
    features: [] as string[],
    duration: '',
    region: '',
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
    serverLocations: [] as string[],
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
    tags: [] as string[],
    // Common fields
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
        adminService.getAllProducts(),
        adminService.getAllGifts()
      ]);
      setProducts(productsData);
      setGifts(giftsData);
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
      price: 0,
      category: 'vpn' as ProductCategory,
      provider: '',
      isActive: true,
      stock: 0,
      features: [],
      duration: '',
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
      serverLocations: [],
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
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      category: product.category || 'vpn',
      provider: product.provider || '',
      isActive: product.isActive !== false,
      stock: product.stock || 0,
      features: product.features || [],
      duration: product.duration || '',
      region: product.region || '',
      // eSIM specific fields
      dataAllowance: (product as any).dataAllowance || '',
      validityPeriod: (product as any).validityPeriod || '',
      networkType: (product as any).networkType || '',
      supportedCountries: (product as any).supportedCountries || [],
      activationMethod: (product as any).activationMethod || '',
      // Proxy specific fields
      proxyType: (product as any).proxyType || '',
      ipType: (product as any).ipType || '',
      bandwidth: (product as any).bandwidth || '',
      concurrentConnections: (product as any).concurrentConnections || 0,
      authMethod: (product as any).authMethod || '',
      // RDP specific fields
      osType: (product as any).osType || '',
      ramSize: (product as any).ramSize || '',
      cpuCores: (product as any).cpuCores || 0,
      storageSize: (product as any).storageSize || '',
      rdpVersion: (product as any).rdpVersion || '',
      // VPN specific fields
      vpnProtocol: (product as any).vpnProtocol || '',
      serverLocations: (product as any).serverLocations || [],
      deviceLimit: (product as any).deviceLimit || 0,
      logPolicy: (product as any).logPolicy || '',
      // SMS specific fields
      smsType: (product as any).smsType || '',
      deliverySpeed: (product as any).deliverySpeed || '',
      supportedNetworks: (product as any).supportedNetworks || [],
      // Gift specific fields
      giftWeight: (product as any).giftWeight || 0,
      giftDimensions: (product as any).giftDimensions || { length: 0, width: 0, height: 0 },
      sizeClass: (product as any).sizeClass || 'medium',
      isFragile: (product as any).isFragile || false,
      handlingTimeDays: (product as any).handlingTimeDays || 3,
      tags: (product as any).tags || [],
      // Common fields
      imageUrl: (product as any).imageUrl || '',
      setupInstructions: (product as any).setupInstructions || '',
      technicalSpecs: (product as any).technicalSpecs || '',
    });
    setEditDialogOpen(true);
  };

  const handleCreateProduct = async () => {
    try {
      setActionLoading(true);
      
      if (!formData.name || !formData.category || !formData.provider || formData.price <= 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      const productId = await adminService.createProduct(formData as any);
      toast.success('Product created successfully');
      
      // Reload products to get fresh data
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
      
      if (!formData.name || !formData.category || !formData.provider || formData.price <= 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      await adminService.updateProduct(selectedProduct.id, formData as any);
      toast.success('Product updated successfully');
      
      // Reload products to get fresh data
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
      ...products.map(p => ({ price: p.price || 0 })),
      ...gifts.map(g => ({ price: g.basePrice || 0 }))
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

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Product Search</CardTitle>
          <CardDescription>Search products by title, provider, or category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={loadProducts}
              className="w-full sm:w-auto"
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Products by Category</CardTitle>
          <CardDescription>Manage products organized by type</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            setSelectedProducts(new Set()); // Clear selections when changing tabs
          }}>
            {/* Mobile-friendly tabs */}
            <div className="w-full overflow-x-auto">
              <TabsList className="grid w-full grid-cols-7 min-w-[700px] lg:min-w-0">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">All Products</span>
                  <span className="sm:hidden">All</span>
                  <span className="ml-1">({products.length + gifts.length})</span>
                </TabsTrigger>
                <TabsTrigger value="esim" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">eSIM</span>
                  <span className="sm:hidden">eSIM</span>
                  <span className="ml-1">({products.filter(p => p.category === 'esim').length})</span>
                </TabsTrigger>
                <TabsTrigger value="proxy" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Proxy</span>
                  <span className="sm:hidden">Proxy</span>
                  <span className="ml-1">({products.filter(p => p.category === 'proxy').length})</span>
                </TabsTrigger>
                <TabsTrigger value="rdp" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">RDP</span>
                  <span className="sm:hidden">RDP</span>
                  <span className="ml-1">({products.filter(p => p.category === 'rdp').length})</span>
                </TabsTrigger>
                <TabsTrigger value="vpn" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">VPN</span>
                  <span className="sm:hidden">VPN</span>
                  <span className="ml-1">({products.filter(p => p.category === 'vpn').length})</span>
                </TabsTrigger>
                <TabsTrigger value="sms" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">SMS</span>
                  <span className="sm:hidden">SMS</span>
                  <span className="ml-1">({products.filter(p => p.category === 'sms').length})</span>
                </TabsTrigger>
                <TabsTrigger value="gift" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Gifts</span>
                  <span className="sm:hidden">Gifts</span>
                  <span className="ml-1">({gifts.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={activeTab} className="mt-4">
              {/* Bulk Actions Bar */}
              {selectedProducts.size > 0 && (
                <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {selectedProducts.size} item{selectedProducts.size > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBulkActivate}
                        disabled={bulkActionLoading}
                        className="flex-1 sm:flex-none"
                      >
                        {bulkActionLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Eye className="h-3 w-3 mr-1" />
                        )}
                        Activate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBulkDeactivate}
                        disabled={bulkActionLoading}
                        className="flex-1 sm:flex-none"
                      >
                        {bulkActionLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <EyeOff className="h-3 w-3 mr-1" />
                        )}
                        Deactivate
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleBulkDelete}
                        disabled={bulkActionLoading}
                        className="flex-1 sm:flex-none"
                      >
                        {bulkActionLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-3 w-3 mr-1" />
                        )}
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedProducts(new Set())}
                        className="flex-1 sm:flex-none"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all products"
                        />
                      </TableHead>
                      <TableHead className="min-w-[200px]">Product</TableHead>
                      <TableHead className="hidden sm:table-cell">Provider</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="hidden lg:table-cell">Status</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                            aria-label={`Select ${product.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              {(product as any).imageUrl ? (
                                <img 
                                  src={(product as any).imageUrl} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                getCategoryIcon(product.category || 'default')
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm sm:text-base truncate">{product.name}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                {product.description?.substring(0, 30)}...
                              </div>
                              {/* Show provider and category on mobile */}
                              <div className="sm:hidden flex flex-wrap gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">{product.provider}</Badge>
                                <Badge variant="secondary" className="text-xs">{product.category?.toUpperCase()}</Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">{product.provider}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(product.category || 'default')}
                            <Badge variant="secondary">{product.category?.toUpperCase()}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{formatStatsAmount(product.price || 0).primary}</div>
                            <div className="text-xs text-muted-foreground hidden sm:block">{formatStatsAmount(product.price || 0).secondary}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={product.isActive}
                              onCheckedChange={() => handleToggleActive(product)}
                              disabled={actionLoading}
                            />
                            <span className="text-sm">
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {/* Mobile: Show status toggle */}
                            <div className="lg:hidden">
                              <Switch
                                checked={product.isActive}
                                onCheckedChange={() => handleToggleActive(product)}
                                disabled={actionLoading}
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(product)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={actionLoading}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Product Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Add a new product to your catalog
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
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
                    placeholder="Enter provider name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter price in USD"
                  />
                  {formData.price > 0 && (
                    <div className="text-xs text-muted-foreground">
                      NGN: {formatStatsAmount(formData.price).secondary}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Product Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Category-Specific Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{formData.category.toUpperCase()} Specific Details</h3>
              <CategorySpecificFields 
                category={formData.category} 
                formData={formData} 
                setFormData={setFormData} 
              />
            </div>

            {/* Common Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 30 days"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="e.g., US, EU"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    placeholder="Stock quantity"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="setupInstructions">Setup Instructions</Label>
                <Textarea
                  id="setupInstructions"
                  value={formData.setupInstructions}
                  onChange={(e) => setFormData({ ...formData, setupInstructions: e.target.value })}
                  placeholder="Step-by-step setup instructions for users"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="technicalSpecs">Technical Specifications</Label>
                <Textarea
                  id="technicalSpecs"
                  value={formData.technicalSpecs}
                  onChange={(e) => setFormData({ ...formData, technicalSpecs: e.target.value })}
                  placeholder="Technical details and specifications"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="active">Active Product</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={actionLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Product
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
              Update product information
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Product Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
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
                  <Label htmlFor="edit-provider">Provider *</Label>
                  <Input
                    id="edit-provider"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="Enter provider name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (USD) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter price in USD"
                  />
                  {formData.price > 0 && (
                    <div className="text-xs text-muted-foreground">
                      NGN: {formatStatsAmount(formData.price).secondary}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-imageUrl">Product Image URL</Label>
                <Input
                  id="edit-imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Category-Specific Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{formData.category.toUpperCase()} Specific Details</h3>
              <CategorySpecificFields 
                category={formData.category} 
                formData={formData} 
                setFormData={setFormData} 
              />
            </div>

            {/* Common Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duration</Label>
                  <Input
                    id="edit-duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 30 days"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-region">Region</Label>
                  <Input
                    id="edit-region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="e.g., US, EU"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Stock</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    placeholder="Stock quantity"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-setupInstructions">Setup Instructions</Label>
                <Textarea
                  id="edit-setupInstructions"
                  value={formData.setupInstructions}
                  onChange={(e) => setFormData({ ...formData, setupInstructions: e.target.value })}
                  placeholder="Step-by-step setup instructions for users"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-technicalSpecs">Technical Specifications</Label>
                <Textarea
                  id="edit-technicalSpecs"
                  value={formData.technicalSpecs}
                  onChange={(e) => setFormData({ ...formData, technicalSpecs: e.target.value })}
                  placeholder="Technical details and specifications"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="edit-active">Active Product</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={actionLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProduct}
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
                  Update Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}