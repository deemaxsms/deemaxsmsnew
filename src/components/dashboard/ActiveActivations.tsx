import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, X, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";
import { getServiceLogo, getCountryData } from "@/lib/service-data";

interface Activation {
  id: string;
  phone_number: string;
  service: string;
  country_code: number;
  activation_type: string;
  status: string;
  sms_code?: string;
  created_at: string;
  rental_days?: number;
  is_voice?: boolean;
}

interface ActiveActivationsProps {
  activations: Activation[];
  onCancel: (id: string) => void;
  onRefresh: () => void;
}

export const ActiveActivations = ({ activations, onCancel, onRefresh }: ActiveActivationsProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "completed":
        return "bg-success/20 text-success";
      case "cancelled":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg sm:text-xl">Active Numbers</CardTitle>
          <CardDescription className="text-sm">Your currently active virtual numbers</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2 sm:mr-0" />
          <span className="sm:hidden">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        {activations.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-2">No active numbers</p>
            <p className="text-sm text-muted-foreground">
              Buy a number from the "Buy Number" tab to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activations.map((activation) => {
              const countryInfo = getCountryData(activation.country_code.toString());
              
              return (
                <div
                  key={activation.id}
                  className="group relative flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-4 sm:p-5 border-2 rounded-xl hover:border-primary/50 hover:shadow-lg transition-all bg-card"
                >
                  {/* Service & Country Icons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <img 
                      src={getServiceLogo(activation.service)}
                      alt={activation.service}
                      className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                    />
                    <img 
                      src={countryInfo.flag}
                      alt={countryInfo.name}
                      className="h-6 w-8 sm:h-8 sm:w-10 object-cover rounded shadow-sm"
                    />
                  </div>

                  <div className="space-y-2 flex-1 w-full sm:w-auto pr-10 sm:pr-0">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="font-mono font-bold text-sm sm:text-lg break-all">{activation.phone_number}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(activation.phone_number)}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
                      <Badge variant="outline" className={getStatusColor(activation.status)}>
                        {activation.status}
                      </Badge>
                      {activation.activation_type && activation.activation_type !== "standard" && (
                        <Badge variant="secondary" className="text-xs">
                          {activation.activation_type}
                          {activation.rental_days && ` - ${activation.rental_days}d`}
                        </Badge>
                      )}
                      {activation.is_voice && (
                        <Badge variant="secondary" className="text-xs">Voice</Badge>
                      )}
                      <span className="text-muted-foreground text-xs sm:text-sm">{formatTimeAgo(activation.created_at)}</span>
                    </div>
                    
                    {activation.sms_code && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-3 p-3 sm:p-4 bg-success/10 border-2 border-success/20 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xs text-success font-medium mb-1">VERIFICATION CODE</p>
                          <code className="text-xl sm:text-2xl font-bold tracking-wider break-all">
                            {activation.sms_code}
                          </code>
                        </div>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => copyToClipboard(activation.sms_code!)}
                          className="border-success/50 hover:bg-success/10 w-full sm:w-auto"
                        >
                          <Copy className="h-5 w-5 mr-2 sm:mr-0" />
                          <span className="sm:hidden">Copy Code</span>
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancel(activation.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 absolute top-2 right-2 sm:top-3 sm:right-3"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
