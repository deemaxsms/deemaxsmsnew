import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  Calendar,
  DollarSign,
  AlertCircle,
  Timer,
  Zap,
  Loader2,
} from 'lucide-react';
import { ServiceIcon } from '@/components/ServiceIcon';

interface ActiveRequest {
  id: string;
  mdn: string | '';
  service: string;
  status: 'Awaiting MDN' | 'Reserved' | 'Completed' | 'Rejected' | 'Timed Out';
  till_expiration: number;
  markup: number;
  price: number;
  carrier?: string;
  createdAt: number;
  messages: Array<{
    timestamp: string;
    date_time: string;
    from: string;
    reply: string;
    pin?: string;
  }>;
}

interface TellabotActiveNumbersProps {
  requests: ActiveRequest[];
  onRefresh: () => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export const TellabotActiveNumbers: React.FC<TellabotActiveNumbersProps> = ({
  requests,
  onRefresh,
  onReject,
}) => {
  const [loadingReject, setLoadingReject] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const handleCopyNumber = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number);
      setCopiedNumber(number);
      toast.success('Phone number copied!');
      setTimeout(() => setCopiedNumber(null), 3000);
    } catch {
      toast.error('Failed to copy number');
    }
  };

  const handleReject = async (id: string) => {
    setLoadingReject(id);
    try {
      await onReject(id);
      toast.success('Request cancelled');
    } catch {
      toast.error('Failed to cancel request');
    } finally {
      setLoadingReject(null);
    }
  };

  const getStatusBadge = (status: ActiveRequest['status']) => {
    const variants: Record<ActiveRequest['status'], { color: string; icon: React.ReactNode }> = {
      'Reserved': { color: 'bg-green-100 text-green-800 border-green-300', icon: <Phone className="h-4 w-4" /> },
      'Awaiting MDN': { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: <Timer className="h-4 w-4" /> },
      'Completed': { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <CheckCircle className="h-4 w-4" /> },
      'Rejected': { color: 'bg-red-100 text-red-800 border-red-300', icon: <XCircle className="h-4 w-4" /> },
      'Timed Out': { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: <Clock className="h-4 w-4" /> },
    };

    const config = variants[status] || variants['Timed Out'];
    return (
      <Badge variant="outline" className={`border ${config.color}`}>
        {config.icon}
        <span className="ml-1 font-medium">{status}</span>
      </Badge>
    );
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Expired';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Requests</h3>
          <p className="text-sm text-gray-600">Your requested numbers will appear here once reserved.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Active Requests ({requests.length})</h2>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {requests.map((request) => (
        <Card key={request.id} className="overflow-hidden border shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <ServiceIcon serviceName={request.service} size="md" />
                <div>
                  <h3 className="font-bold text-lg">{request.service}</h3>
                  <p className="text-sm text-gray-600">Request ID: {request.id}</p>
                </div>
              </div>
              {getStatusBadge(request.status)}
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {/* Number & Copy */}
            {request.mdn ? (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span className="font-mono text-lg font-bold">{request.mdn}</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopyNumber(request.mdn)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copiedNumber === request.mdn ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <Timer className="h-5 w-5" />
                  <span className="font-medium">Number not yet assigned</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  {request.status === 'Awaiting MDN'
                    ? 'Your priority bid is active — waiting for an available number.'
                    : 'Number is being reserved...'}
                </p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Price</p>
                <p className="font-semibold">${request.price.toFixed(2)}</p>
              </div>
              {request.markup > 0 && (
                <div>
                  <p className="text-gray-500">Priority Bid</p>
                  <p className="font-semibold text-amber-600">+${(request.markup / 100).toFixed(2)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium">{formatDate(request.createdAt)}</p>
              </div>
              {(request.status === 'Reserved' || request.status === 'Awaiting MDN') && (
                <div>
                  <p className="text-gray-500">Time Left</p>
                  <p className={`font-bold ${request.till_expiration < 300 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatTimeRemaining(request.till_expiration)}
                  </p>
                </div>
              )}
              {request.carrier && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-gray-500">Carrier</p>
                  <p className="font-medium">{request.carrier}</p>
                </div>
              )}
            </div>

            {/* Messages */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                SMS Messages ({request.messages.length})
              </h4>

              {request.messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p>Waiting for messages...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {request.messages.map((msg, idx) => (
                    <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span className="font-medium">From: {msg.from}</span>
                        <span>{msg.date_time}</span>
                      </div>
                      <p className="text-gray-800 mb-3 break-words">{msg.reply}</p>
                      {msg.pin && (
                        <div className="bg-blue-100 border-l-4 border-blue-500 p-3 rounded-r-lg">
                          <p className="font-bold text-blue-900">
                            Verification Code: <span className="text-2xl">{msg.pin}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {(request.status === 'Awaiting MDN' || request.status === 'Reserved') && (
              <div className="pt-4 border-t flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(request.id)}
                  disabled={loadingReject === request.id}
                >
                  {loadingReject === request.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Cancel Request
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};