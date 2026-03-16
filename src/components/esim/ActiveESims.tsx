import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  Database, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Wifi,
  Calendar,
  Signal
} from 'lucide-react';
import { ESimOrder, ESimUsageStats } from '@/types/esim-types';
import { esimService } from '@/services/esim-service';

interface ActiveESimsProps {
  esims: ESimOrder[];
  onSelectESim: (esim: ESimOrder) => void;
  selectedESimId?: string;
  onRefresh: () => void;
  loading?: boolean;
}

export const ActiveESims: React.FC<ActiveESimsProps> = ({
  esims,
  onSelectESim,
  selectedESimId,
  onRefresh,
  loading = false
}) => {
  const formatDataAmount = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)}GB`;
    }
    return `${mb}MB`;
  };

  const formatDate = (date: Date | string | any) => {
    try {
      let d: Date;
      
      if (date && typeof date === 'object' && date.toDate) {
        d = date.toDate();
      } else if (date && typeof date === 'object' && date.seconds) {
        d = new Date(date.seconds * 1000);
      } else {
        d = new Date(date);
      }
      
      if (isNaN(d.getTime())) {
        return 'Invalid Date';
      }
      
      return d.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: ESimOrder['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageStats = (esim: ESimOrder): ESimUsageStats => {
    return esimService.getUsageStats(esim);
  };

  if (esims.length === 0) {
    return (
      <Card className="mx-2 sm:mx-0">
        <CardContent className="pt-6">
          <div className="text-center py-6 sm:py-8">
            <Smartphone className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Active e-SIMs</h3>
            <p className="text-sm sm:text-base text-gray-600">
              You don't have any active e-SIMs that can be refilled.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Your Active e-SIMs ({esims.length})</h2>
          <p className="text-sm text-gray-600">Select an e-SIM to refill</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="w-full sm:w-auto">
          <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {esims.map((esim) => {
          const stats = getUsageStats(esim);
          const isSelected = selectedESimId === esim.id;

          return (
            <Card 
              key={esim.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => onSelectESim(esim)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-blue-600" />
                      {esim.provider} - {esim.region}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <span className="font-mono">{esim.iccid.slice(-8)}</span>
                      <span>•</span>
                      <span>{esim.dataAllowance}</span>
                      <span>•</span>
                      <span>{esim.validityPeriod}</span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(esim.status)}>
                    <Signal className="h-3 w-3 mr-1" />
                    {esim.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Data Usage */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Data Usage</span>
                    <span className="font-medium">
                      {formatDataAmount(stats.usedData)} / {formatDataAmount(stats.totalData)}
                    </span>
                  </div>
                  <Progress 
                    value={stats.dataUsagePercentage} 
                    className="h-2"
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{formatDataAmount(stats.remainingData)} remaining</span>
                    <span>{stats.dataUsagePercentage.toFixed(1)}% used</span>
                  </div>
                </div>

                {/* Alerts */}
                {(stats.isLowData || stats.isExpiringSoon) && (
                  <div className="space-y-2">
                    {stats.isLowData && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="text-xs sm:text-sm text-orange-800">
                          Low data: Only {formatDataAmount(stats.remainingData)} remaining
                        </span>
                      </div>
                    )}
                    {stats.isExpiringSoon && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                        <Clock className="h-4 w-4 text-red-600" />
                        <span className="text-xs sm:text-sm text-red-800">
                          Expires in {stats.daysRemaining} day{stats.daysRemaining !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-600">Expires:</span>
                    <p className="font-medium">{formatDate(esim.expiresAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Days Left:</span>
                    <p className="font-medium">{stats.daysRemaining} days</p>
                  </div>
                </div>

                {/* Select Button */}
                <Button 
                  className="w-full" 
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                >
                  {isSelected ? 'Selected for Refill' : 'Select for Refill'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-3 text-sm">Usage Indicators:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Low Data: Less than 10% remaining</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Expiring Soon: 3 days or less</span>
          </div>
        </div>
      </div>
    </div>
  );
};