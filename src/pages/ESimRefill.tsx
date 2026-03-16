/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  CheckCircle, 
  ArrowLeft,
  Wifi,
  Database,
  Clock,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { ActiveESims } from '@/components/esim/ActiveESims';
import { RefillPlans } from '@/components/esim/RefillPlans';
import { ESimOrder, RefillPlan, ESimRefillSubmission } from '@/types/esim-types';
import { esimService } from '@/services/esim-service';
import { toast } from 'sonner';
import { Header } from '@/components/Header';

export const ESimRefill: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [activeESims, setActiveESims] = useState<ESimOrder[]>([]);
  const [refillPlans, setRefillPlans] = useState<RefillPlan[]>([]);
  const [selectedESim, setSelectedESim] = useState<ESimOrder | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<RefillPlan | null>(null);
  const [currentStep, setCurrentStep] = useState<'select-esim' | 'select-plan' | 'confirm'>('select-esim');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      loadActiveESims();
    }
  }, [user]);

  useEffect(() => {
    if (selectedESim) {
      loadRefillPlans(selectedESim);
      setCurrentStep('select-plan');
    }
  }, [selectedESim]);

  useEffect(() => {
    if (selectedPlan) {
      setCurrentStep('confirm');
    }
  }, [selectedPlan]);

  const loadActiveESims = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const esims = await esimService.getActiveESimOrders(user.uid);
      setActiveESims(esims);
    } catch (error) {
      console.error('Error loading e-SIMs:', error);
      toast.error('Failed to load your e-SIMs');
    } finally {
      setLoading(false);
    }
  };

  const loadRefillPlans = async (esim: ESimOrder) => {
    try {
      setLoading(true);
      const plans = await esimService.getRefillPlans(esim);
      setRefillPlans(plans);
    } catch (error) {
      console.error('Error loading refill plans:', error);
      toast.error('Failed to load refill plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectESim = (esim: ESimOrder) => {
    setSelectedESim(esim);
    setSelectedPlan(null); // Reset plan selection
  };

  const handleSelectPlan = (plan: RefillPlan) => {
    setSelectedPlan(plan);
  };

  const handleProcessRefill = async () => {
    if (!user || !selectedESim || !selectedPlan) return;

    try {
      setProcessing(true);

      const request: ESimRefillSubmission = {
        esimOrderId: selectedESim.id,
        refillPlanId: selectedPlan.id,
        refillType: selectedPlan.type === 'data-only' ? 'data' :
          selectedPlan.type === 'validity-only' ? 'validity' : 'both',
        dataAmount: selectedPlan.dataAmount,
        validityExtension: selectedPlan.validityDays
      };

      const result = await esimService.processRefill(user.uid, request);

      if (result.success) {
        toast.success('e-SIM refill completed successfully!');
        
        // Reset state and reload data
        setSelectedESim(null);
        setSelectedPlan(null);
        setCurrentStep('select-esim');
        await loadActiveESims();
        
        // Navigate to orders page to show the refill
        navigate('/orders');
      } else {
        toast.error(result.error || 'Failed to process refill');
      }
    } catch (error) {
      console.error('Error processing refill:', error);
      toast.error('Failed to process refill');
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'confirm') {
      setSelectedPlan(null);
      setCurrentStep('select-plan');
    } else if (currentStep === 'select-plan') {
      setSelectedESim(null);
      setRefillPlans([]);
      setCurrentStep('select-esim');
    }
  };

  const formatDataAmount = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)}GB`;
    }
    return `${mb}MB`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
                <p className="text-gray-600 mb-4">Please log in to access e-SIM refill.</p>
                <Button onClick={() => navigate('/login')}>Log In</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">e-SIM Refill</h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            Add data or extend validity for your existing e-SIMs
          </p>
          
          {/* Features */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 mt-4">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
              <Database className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <span>Instant Data Top-up</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span>Validity Extension</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
              <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
              <span>No Interruption</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-4 sm:space-x-8">
            <div className={`flex items-center space-x-2 ${
              currentStep === 'select-esim' ? 'text-blue-600' : 
              selectedESim ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                currentStep === 'select-esim' ? 'bg-blue-600 text-white' :
                selectedESim ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {selectedESim ? <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> : '1'}
              </div>
              <span className="text-xs sm:text-sm font-medium">Select e-SIM</span>
            </div>

            <div className={`w-8 sm:w-12 h-0.5 ${selectedESim ? 'bg-green-600' : 'bg-gray-200'}`}></div>

            <div className={`flex items-center space-x-2 ${
              currentStep === 'select-plan' ? 'text-blue-600' : 
              selectedPlan ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                currentStep === 'select-plan' ? 'bg-blue-600 text-white' :
                selectedPlan ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {selectedPlan ? <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> : '2'}
              </div>
              <span className="text-xs sm:text-sm font-medium">Choose Plan</span>
            </div>

            <div className={`w-8 sm:w-12 h-0.5 ${selectedPlan ? 'bg-green-600' : 'bg-gray-200'}`}></div>

            <div className={`flex items-center space-x-2 ${
              currentStep === 'confirm' ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                currentStep === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-xs sm:text-sm font-medium">Confirm</span>
            </div>
          </div>
        </div>

        {/* Back Button */}
        {currentStep !== 'select-esim' && (
          <div className="mb-4">
            <Button variant="ghost" onClick={handleBack} className="text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        )}

        {/* Content */}
        {currentStep === 'select-esim' && (
          <ActiveESims
            esims={activeESims}
            onSelectESim={handleSelectESim}
            selectedESimId={selectedESim?.id}
            onRefresh={loadActiveESims}
            loading={loading}
          />
        )}

        {currentStep === 'select-plan' && selectedESim && (
          <RefillPlans
            plans={refillPlans}
            onSelectPlan={handleSelectPlan}
            selectedPlanId={selectedPlan?.id}
            loading={loading}
          />
        )}

        {currentStep === 'confirm' && selectedESim && selectedPlan && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Confirm Refill
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* e-SIM Details */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">e-SIM Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium">{selectedESim.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Region:</span>
                    <span className="font-medium">{selectedESim.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ICCID:</span>
                    <span className="font-mono text-xs">{selectedESim.iccid}</span>
                  </div>
                </div>
              </div>

              {/* Refill Plan Details */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-3">Refill Plan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  {selectedPlan.dataAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data:</span>
                      <span className="font-medium text-blue-600">
                        +{formatDataAmount(selectedPlan.dataAmount)}
                      </span>
                    </div>
                  )}
                  {selectedPlan.validityDays && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Validity:</span>
                      <span className="font-medium text-green-600">
                        +{selectedPlan.validityDays} days
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Price:</span>
                    <span className="text-lg font-bold">${selectedPlan.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Balance Check */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Your Balance:</span>
                  <span className="font-bold text-lg">${profile?.balance?.toFixed(2) || '0.00'}</span>
                </div>
                {profile && profile.balance < selectedPlan.price && (
                  <p className="text-red-600 text-sm mt-2">
                    Insufficient balance. Please top up your account.
                  </p>
                )}
              </div>

              {/* Confirm Button */}
              <Button 
                onClick={handleProcessRefill}
                disabled={processing || !profile || profile.balance < selectedPlan.price}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Processing Refill...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Refill - ${selectedPlan.price.toFixed(2)}
                  </>
                )}
              </Button>

              {profile && profile.balance < selectedPlan.price && (
                <Button 
                  variant="outline"
                  onClick={() => navigate('/top-up')}
                  className="w-full"
                >
                  Top Up Balance
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};