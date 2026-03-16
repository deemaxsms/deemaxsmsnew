import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Clock, 
  Zap, 
  Star,
  CheckCircle
} from 'lucide-react';
import { RefillPlan } from '@/types/esim-types';

interface RefillPlansProps {
  plans: RefillPlan[];
  onSelectPlan: (plan: RefillPlan) => void;
  selectedPlanId?: string;
  loading?: boolean;
}

export const RefillPlans: React.FC<RefillPlansProps> = ({
  plans,
  onSelectPlan,
  selectedPlanId,
  loading = false
}) => {
  const formatDataAmount = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)}GB`;
    }
    return `${mb}MB`;
  };

  const getTypeIcon = (type: RefillPlan['type']) => {
    switch (type) {
      case 'data-only':
        return <Database className="h-4 w-4" />;
      case 'validity-only':
        return <Clock className="h-4 w-4" />;
      case 'data-and-validity':
        return <Zap className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: RefillPlan['type']) => {
    switch (type) {
      case 'data-only':
        return 'bg-blue-100 text-blue-800';
      case 'validity-only':
        return 'bg-green-100 text-green-800';
      case 'data-and-validity':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: RefillPlan['type']) => {
    switch (type) {
      case 'data-only':
        return 'Data Only';
      case 'validity-only':
        return 'Validity Only';
      case 'data-and-validity':
        return 'Data + Validity';
      default:
        return 'Unknown';
    }
  };

  if (plans.length === 0) {
    return (
      <Card className="mx-2 sm:mx-0">
        <CardContent className="pt-6">
          <div className="text-center py-6 sm:py-8">
            <Database className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Refill Plans Available</h3>
            <p className="text-sm sm:text-base text-gray-600">
              No refill plans are currently available for this e-SIM.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <div className="text-center mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Choose a Refill Plan</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Select a plan to add data or extend validity for your e-SIM
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedPlanId === plan.id 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => onSelectPlan(plan)}
          >
            {plan.isPopular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-orange-500 text-white px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              </div>
            )}

            {selectedPlanId === plan.id && (
              <div className="absolute top-3 right-3">
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">{plan.name}</CardTitle>
                <Badge className={getTypeColor(plan.type)}>
                  {getTypeIcon(plan.type)}
                  <span className="ml-1 text-xs">{getTypeLabel(plan.type)}</span>
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{plan.description}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Plan Details */}
              <div className="space-y-2">
                {plan.dataAmount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium text-blue-600">
                      +{formatDataAmount(plan.dataAmount)}
                    </span>
                  </div>
                )}
                
                {plan.validityDays && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Validity:</span>
                    <span className="font-medium text-green-600">
                      +{plan.validityDays} days
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Price:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${plan.price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Select Button */}
              <Button 
                className="w-full" 
                variant={selectedPlanId === plan.id ? "default" : "outline"}
                disabled={loading}
              >
                {selectedPlanId === plan.id ? 'Selected' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Type Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-3 text-sm">Plan Types:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            <span><strong>Data Only:</strong> Adds data to your current plan</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            <span><strong>Validity Only:</strong> Extends your plan duration</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-600" />
            <span><strong>Data + Validity:</strong> Adds both data and time</span>
          </div>
        </div>
      </div>
    </div>
  );
};