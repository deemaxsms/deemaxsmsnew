/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle
} from 'lucide-react';
import { SMSNumber } from '@/types/sms-types';
import { smsService } from '@/services/sms-service';
import { useAuth } from '@/lib/auth-context';

interface ActiveNumbersProps {
  numbers: SMSNumber[];
  onRefresh: () => void;
}

export const ActiveNumbers: React.FC<ActiveNumbersProps> = ({ numbers, onRefresh }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const handleCopyNumber = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number);
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(null), 2000);
    } catch (error) {
      console.error('Failed to copy number:', error);
    }
  };

  const handleCancelNumber = async (numberId: string) => {
    if (!user) return;
    
    setLoading(numberId);
    try {
      const result = await smsService.cancelOrder(numberId, user.uid);
      if (result.success) {
        onRefresh();
      } else {
        alert(result.error || 'Failed to cancel number');
      }
    } catch (error) {
      console.error('Error cancelling number:', error);
      alert('Failed to cancel number');
    } finally {
      setLoading(null);
    }
  };

  const handleExtendRental = async (numberId: string, days: number) => {
    if (!user) return;
    
    setLoading(numberId);
    try {
      const result = await smsService.extendRental(numberId, days, user.uid);
      if (result.success) {
        onRefresh();
      } else {
        alert(result.error || 'Failed to extend rental');
      }
    } catch (error) {
      console.error('Error extending rental:', error);
      alert('Failed to extend rental');
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: SMSNumber['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: SMSNumber['status']) => {
    switch (status) {
      case 'active':
        return <Phone className="h-4 w-4" />;
      case 'waiting':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatTimeRemaining = (expiresAt: Date | string | any) => {
    try {
      let expireDate: Date;
      
      // Handle Firestore Timestamp objects
      if (expiresAt && typeof expiresAt === 'object' && expiresAt.toDate) {
        expireDate = expiresAt.toDate();
      } else if (expiresAt && typeof expiresAt === 'object' && expiresAt.seconds) {
        expireDate = new Date(expiresAt.seconds * 1000);
      } else {
        expireDate = new Date(expiresAt);
      }
      
      // Check if date is valid
      if (isNaN(expireDate.getTime())) {
        return 'Invalid Date';
      }
      
      const now = new Date();
      const timeLeft = expireDate.getTime() - now.getTime();
      
      if (timeLeft <= 0) return 'Expired';
      
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
      }
      
      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error('Error formatting time remaining:', error);
      return 'Invalid Date';
    }
  };

  if (numbers.length === 0) {
    return (
      <Card className="mx-2 sm:mx-0">
        <CardContent className="pt-6">
          <div className="text-center py-6 sm:py-8">
            <Phone className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Active Numbers</h3>
            <p className="text-sm sm:text-base text-gray-600">You don't have any active SMS numbers yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h2 className="text-lg sm:text-xl font-semibold">Active Numbers ({numbers.length})</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} className="w-full sm:w-auto">
          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {numbers.map((number) => (
        <Card key={number.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="font-mono text-sm sm:text-base">{number.number}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyNumber(number.number)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {copiedNumber === number.number && (
                      <span className="text-xs text-green-600">Copied!</span>
                    )}
                  </div>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <span>{number.service}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{number.country}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {number.price.toFixed(2)}
                  </span>
                </div>
              </div>
              <Badge className={getStatusColor(number.status)}>
                {getStatusIcon(number.status)}
                <span className="ml-1 capitalize">{number.status}</span>
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Time and Type Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>
                  {number.type === 'rental' 
                    ? `${number.rentalDuration} day rental` 
                    : 'One-time use'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                <span className={
                  (() => {
                    try {
                      let expireDate: Date;
                      if (number.expiresAt && typeof number.expiresAt === 'object' && 'toDate' in number.expiresAt) {
                        expireDate = (number.expiresAt as any).toDate();
                      } else if (number.expiresAt && typeof number.expiresAt === 'object' && 'seconds' in number.expiresAt) {
                        expireDate = new Date((number.expiresAt as any).seconds * 1000);
                      } else {
                        expireDate = new Date(number.expiresAt);
                      }
                      
                      const timeLeft = expireDate.getTime() - Date.now();
                      return timeLeft < 60 * 60 * 1000 ? 'text-red-600 font-medium' : 'text-gray-600';
                    } catch {
                      return 'text-gray-600';
                    }
                  })()
                }>
                  {formatTimeRemaining(number.expiresAt)}
                </span>
              </div>
            </div>

            {/* Messages */}
            {number.messages.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                  Messages ({number.messages.length})
                </h4>
                <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                  {number.messages.map((message) => (
                    <div key={message.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-1 mb-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          From: {message.from}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            try {
                              let messageDate: Date;
                              if (message.receivedAt && typeof message.receivedAt === 'object' && 'toDate' in message.receivedAt) {
                                messageDate = (message.receivedAt as any).toDate();
                              } else if (message.receivedAt && typeof message.receivedAt === 'object' && 'seconds' in message.receivedAt) {
                                messageDate = new Date((message.receivedAt as any).seconds * 1000);
                              } else {
                                messageDate = new Date(message.receivedAt);
                              }
                              
                              if (isNaN(messageDate.getTime())) {
                                return 'Invalid Date';
                              }
                              
                              return messageDate.toLocaleTimeString();
                            } catch {
                              return 'Invalid Date';
                            }
                          })()}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 break-words">{message.text}</p>
                      {message.code && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                          <span className="text-xs sm:text-sm font-medium text-blue-800">
                            Verification Code: {message.code}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-xs sm:text-sm">Waiting for SMS messages...</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              {number.status === 'active' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelNumber(number.id)}
                    disabled={loading === number.id}
                    className="w-full sm:w-auto"
                  >
                    {loading === number.id ? (
                      <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    )}
                    Cancel
                  </Button>
                  
                  {number.type === 'rental' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExtendRental(number.id, 7)}
                      disabled={loading === number.id}
                      className="w-full sm:w-auto"
                    >
                      {loading === number.id ? (
                        <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
                      ) : (
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      )}
                      Extend +7 days
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};