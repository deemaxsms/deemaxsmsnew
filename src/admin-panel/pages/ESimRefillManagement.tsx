import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Smartphone, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Filter,
  Database,
  Calendar,
  User,
  DollarSign,
  Eye,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { esimService } from '@/services/esim-service';
import { ESimRefillRequest } from '@/types/esim-types';
import { useAdminAuth } from '@/admin-panel/auth/AdminAuthContext';

export const ESimRefillManagement: React.FC = () => {
  const { user } = useAdminAuth();
  const [requests, setRequests] = useState<ESimRefillRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ESimRefillRequest | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRefillRequests();
  }, []);

  const loadRefillRequests = async () => {
    try {
      setLoading(true);
      const data = await esimService.getAllRefillRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading refill requests:', error);
      toast.error('Failed to load refill requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!user) return;
    
    try {
      setProcessingId(requestId);
      const result = await esimService.approveRefillRequest(requestId, user.uid, adminNotes);
      
      if (result.success) {
        toast.success('Refill request approved successfully');
        await loadRefillRequests();
        setSelectedRequest(null);
        setAdminNotes('');
      } else {
        toast.error(result.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user || !adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      setProcessingId(requestId);
      const result = await esimService.rejectRefillRequest(requestId, user.uid, adminNotes);
      
      if (result.success) {
        toast.success('Refill request rejected');
        await loadRefillRequests();
        setSelectedRequest(null);
        setAdminNotes('');
      } else {
        toast.error(result.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'approved':
        return 'bg-blue-500 text-white';
      case 'rejected':
        return 'bg-red-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-yellow-500 text-white';
    }
  };

  const formatDataAmount = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)}GB`;
    }
    return `${mb}MB`;
  };

  const filteredRequests = requests.filter(request =>
    request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.esimDetails.iccid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = filteredRequests.filter(r => r.status === 'pending');
  const processedRequests = filteredRequests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">e-SIM Refill Management</h1>
          <p className="text-muted-foreground">
            Manage and process e-SIM refill requests from users
          </p>
        </div>
        <Button onClick={loadRefillRequests} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, username, ICCID, or request ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ${requests.reduce((sum, r) => sum + r.refillPlan.price, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Processed ({processedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({filteredRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                <p className="text-muted-foreground">
                  All refill requests have been processed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <RefillRequestCard
                  key={request.id}
                  request={request}
                  onViewDetails={setSelectedRequest}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  formatDataAmount={formatDataAmount}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          <div className="grid gap-4">
            {processedRequests.map((request) => (
              <RefillRequestCard
                key={request.id}
                request={request}
                onViewDetails={setSelectedRequest}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                formatDataAmount={formatDataAmount}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <RefillRequestCard
                key={request.id}
                request={request}
                onViewDetails={setSelectedRequest}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                formatDataAmount={formatDataAmount}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => {
            setSelectedRequest(null);
            setAdminNotes('');
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          adminNotes={adminNotes}
          setAdminNotes={setAdminNotes}
          processing={processingId === selectedRequest.id}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          formatDataAmount={formatDataAmount}
        />
      )}
    </div>
  );
};

// Refill Request Card Component
const RefillRequestCard = ({ 
  request, 
  onViewDetails, 
  getStatusIcon, 
  getStatusColor, 
  formatDataAmount 
}: {
  request: ESimRefillRequest;
  onViewDetails: (request: ESimRefillRequest) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  formatDataAmount: (mb: number) => string;
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold">{request.refillPlan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {request.userEmail} • {request.esimDetails.provider}
                </p>
              </div>
              <Badge className={`${getStatusColor(request.status)} ml-auto`}>
                {request.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{request.username}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>
                  {request.refillPlan.dataAmount 
                    ? formatDataAmount(request.refillPlan.dataAmount)
                    : 'No data'
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {request.refillPlan.validityDays 
                    ? `${request.refillPlan.validityDays} days`
                    : 'No extension'
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">${request.refillPlan.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              <span>Request ID: {request.id}</span>
              <span className="mx-2">•</span>
              <span>Created: {format(request.createdAt, 'MMM dd, yyyy HH:mm')}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(request)}
            className="ml-4"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Request Details Modal Component
const RequestDetailsModal = ({
  request,
  onClose,
  onApprove,
  onReject,
  adminNotes,
  setAdminNotes,
  processing,
  getStatusIcon,
  getStatusColor,
  formatDataAmount
}: {
  request: ESimRefillRequest;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
  processing: boolean;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  formatDataAmount: (mb: number) => string;
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Refill Request Details
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            {getStatusIcon(request.status)}
            <Badge className={getStatusColor(request.status)}>
              {request.status}
            </Badge>
          </div>

          {/* User Information */}
          <div className="space-y-3">
            <h4 className="font-semibold">User Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{request.userEmail}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Username:</span>
                <p className="font-medium">{request.username}</p>
              </div>
            </div>
          </div>

          {/* e-SIM Details */}
          <div className="space-y-3">
            <h4 className="font-semibold">e-SIM Details</h4>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">ICCID:</span>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                  {request.esimDetails.iccid}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Provider:</span>
                  <p className="font-medium">{request.esimDetails.provider}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Region:</span>
                  <p className="font-medium">{request.esimDetails.region}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Current Data:</span>
                  <p className="font-medium">
                    {formatDataAmount(request.esimDetails.currentDataRemaining)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expires:</span>
                  <p className="font-medium">
                    {format(request.esimDetails.currentExpiresAt, 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Refill Plan */}
          <div className="space-y-3">
            <h4 className="font-semibold">Refill Plan</h4>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium mb-2">{request.refillPlan.name}</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {request.refillPlan.dataAmount && (
                  <div>
                    <span className="text-muted-foreground">Data:</span>
                    <p className="font-medium text-blue-600">
                      +{formatDataAmount(request.refillPlan.dataAmount)}
                    </p>
                  </div>
                )}
                {request.refillPlan.validityDays && (
                  <div>
                    <span className="text-muted-foreground">Validity:</span>
                    <p className="font-medium text-green-600">
                      +{request.refillPlan.validityDays} days
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <p className="text-lg font-bold">${request.refillPlan.price.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium capitalize">{request.refillType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Request Info */}
          <div className="space-y-3">
            <h4 className="font-semibold">Request Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">
                  {format(request.createdAt, 'PPP p')}
                </p>
              </div>
              {request.processedAt && (
                <div>
                  <span className="text-muted-foreground">Processed:</span>
                  <p className="font-medium">
                    {format(request.processedAt, 'PPP p')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          {request.status === 'pending' && (
            <div className="space-y-3">
              <h4 className="font-semibold">Admin Notes</h4>
              <Textarea
                placeholder="Add notes about this refill request..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Existing Admin Notes */}
          {request.adminNotes && (
            <div className="space-y-3">
              <h4 className="font-semibold">Admin Notes</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm">{request.adminNotes}</p>
                {request.processedBy && (
                  <p className="text-xs text-muted-foreground mt-2">
                    By: {request.processedBy}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {request.status === 'pending' && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => onApprove(request.id)}
                disabled={processing}
                className="flex-1"
              >
                {processing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve Refill
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => onReject(request.id)}
                disabled={processing || !adminNotes.trim()}
                className="flex-1"
              >
                {processing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Reject Request
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};