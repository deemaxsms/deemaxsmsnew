import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Calendar, TrendingUp, DollarSign, Activity, Zap, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";

interface HealthData {
  isValid: boolean;
  discrepancy: number;
  currentBalance: number;
  calculatedBalance: number;
  transactionCount: number;
  lastCheck?: Date;
  fixAttempts?: number;
}

export const TransactionHealthCheck = () => {
  const { user, profile, verifyBalance, fixBalance, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(false);
  const [fixProgress, setFixProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-check on component mount if user has balance
  useEffect(() => {
    if (user && profile && profile.balance > 0 && !healthData) {
      runHealthCheck();
    }
  }, [user, profile]);

  // Auto-check every 5 minutes if enabled
  useEffect(() => {
    if (!autoCheckEnabled) return;

    const interval = setInterval(() => {
      if (!checking && !fixing) {
        runHealthCheck();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoCheckEnabled, checking, fixing]);

  const runHealthCheck = async () => {
    if (!user) return;

    setChecking(true);
    try {
      const result = await verifyBalance();
      
      // Get additional data for enhanced display
      const enhancedData: HealthData = {
        isValid: result.isValid,
        discrepancy: result.discrepancy,
        currentBalance: result.currentBalance || profile?.balance || 0,
        calculatedBalance: result.calculatedBalance || ((profile?.balance || 0) - result.discrepancy),
        transactionCount: result.transactionCount || 0,
        lastCheck: new Date(),
        fixAttempts: healthData?.fixAttempts || 0
      };

      setHealthData(enhancedData);

      if (result.isValid) {
        toast.success("✅ Balance verification passed!", {
          description: "Your account balance is accurate and up to date."
        });
      } else {
        toast.warning(`⚠️ Balance discrepancy detected!`, {
          description: `Difference of ${formatCurrency(Math.abs(result.discrepancy), 'USD')} found.`
        });
      }
    } catch (error) {
      console.error("Health check failed:", error);
      toast.error("❌ Health check failed", {
        description: "Unable to verify balance. Please try again."
      });
    } finally {
      setChecking(false);
    }
  };

  const autoFixIssues = async () => {
    if (!user || !healthData) return;

    setFixing(true);
    setFixProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setFixProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await fixBalance();
      
      clearInterval(progressInterval);
      setFixProgress(100);

      if (result.success) {
        toast.success("🎉 Balance issues fixed successfully!", {
          description: "Your account balance has been corrected and synchronized."
        });
        
        // Update fix attempts counter
        setHealthData(prev => prev ? {
          ...prev,
          fixAttempts: (prev.fixAttempts || 0) + 1
        } : null);

        // Refresh profile to get updated balance
        await refreshProfile();
        
        // Re-run health check to verify fix
        setTimeout(() => {
          runHealthCheck();
        }, 1000);
      } else {
        toast.error("❌ Failed to fix balance issues", {
          description: result.error || "An unknown error occurred during the fix process."
        });
      }
    } catch (error) {
      console.error("Auto-fix failed:", error);
      toast.error("❌ Auto-fix failed", {
        description: "Unable to fix balance issues. Please contact support."
      });
    } finally {
      setFixing(false);
      setFixProgress(0);
    }
  };

  const getHealthStatus = () => {
    if (!healthData) return { color: "gray", text: "Unknown", icon: Activity };
    
    if (healthData.isValid) {
      return { color: "green", text: "Healthy", icon: CheckCircle };
    } else if (Math.abs(healthData.discrepancy) < 10) {
      return { color: "yellow", text: "Minor Issues", icon: AlertTriangle };
    } else {
      return { color: "red", text: "Critical Issues", icon: AlertTriangle };
    }
  };

  const status = getHealthStatus();

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
          status.color === 'green' ? 'from-green-500 to-emerald-500' :
          status.color === 'yellow' ? 'from-yellow-500 to-orange-500' :
          status.color === 'red' ? 'from-red-500 to-rose-500' :
          'from-gray-400 to-gray-500'
        }`} />
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                status.color === 'green' ? 'bg-green-100 text-green-600' :
                status.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                status.color === 'red' ? 'bg-red-100 text-red-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Transaction Health Check</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <status.icon className="h-3 w-3" />
                  Status: {status.text}
                </CardDescription>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-muted-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={runHealthCheck}
              disabled={checking || fixing}
              className="flex-1"
            >
              {checking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Health Check
                </>
              )}
            </Button>
            
            {healthData && !healthData.isValid && (
              <Button 
                onClick={autoFixIssues}
                disabled={true}
                className="flex-1 bg-red-600 hover:bg-red-700 opacity-50 cursor-not-allowed"
                title="Auto-fix disabled for security reasons"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Auto-Fix Disabled
              </Button>
            )}
          </div>

          {/* Fix Progress */}
          {fixing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fixing balance issues...</span>
                <span className="font-medium">{fixProgress}%</span>
              </div>
              <Progress value={fixProgress} className="h-2" />
            </div>
          )}

          {/* Health Data Display */}
          {healthData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {healthData.isValid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      ✅ All Good
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <Badge variant="destructive" className="animate-pulse">
                      ⚠️ Issues Found
                    </Badge>
                  </>
                )}
              </div>

              {/* Balance Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    Current Balance
                  </div>
                  <p className="font-bold text-xl">{formatCurrency(profile.balance || 0, 'USD')}</p>
                </div>
                
                {!healthData.isValid && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      Discrepancy
                    </div>
                    <p className="font-bold text-xl text-red-600">
                      {healthData.discrepancy > 0 ? '+' : ''}{formatCurrency(healthData.discrepancy, 'USD')}
                    </p>
                  </div>
                )}
              </div>

              {/* Security Alert */}
              <Alert className="border-orange-200 bg-orange-50 mb-4">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>🚨 Security Notice:</strong> Auto-fix has been disabled due to a critical bug that could inflate balances.
                  <br />
                  <span className="text-sm">
                    If you see discrepancies, please contact support immediately. Do not attempt manual corrections.
                  </span>
                </AlertDescription>
              </Alert>

              {/* Issue Alert */}
              {!healthData.isValid && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Balance discrepancy detected:</strong> {formatCurrency(Math.abs(healthData.discrepancy), 'USD')}
                    <br />
                    <span className="text-sm">
                      Your profile balance doesn't match your transaction history. 
                      {healthData.discrepancy > 0 ? ' You may be missing credits.' : ' You may have been overcharged.'}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Advanced Settings */}
              {showAdvanced && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Auto Health Checks</label>
                        <p className="text-xs text-muted-foreground">
                          Automatically check balance every 5 minutes
                        </p>
                      </div>
                      <Switch
                        checked={autoCheckEnabled}
                        onCheckedChange={setAutoCheckEnabled}
                      />
                    </div>

                    {healthData.fixAttempts && healthData.fixAttempts > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Fix attempts:</strong> {healthData.fixAttempts}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Last Check Time */}
              {healthData.lastCheck && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="h-3 w-3" />
                  Last checked: {healthData.lastCheck.toLocaleString()}
                </div>
              )}

              {/* Recommendations */}
              <div className="text-xs text-muted-foreground space-y-2 pt-2 border-t">
                <p><strong>💡 Recommendations:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {!healthData.isValid && (
                    <li>Click "Auto-Fix Issues" to correct your balance automatically</li>
                  )}
                  <li>Run health checks after making transactions</li>
                  <li>Enable auto-checks for continuous monitoring</li>
                  <li>Contact support if issues persist after multiple fix attempts</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};