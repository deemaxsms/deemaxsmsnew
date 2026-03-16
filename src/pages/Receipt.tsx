import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt as ReceiptIcon, CheckCircle } from "lucide-react";
import { firestoreService } from "@/lib/firestore-service";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

export default function Receipt() {
  const { txRef = "" } = useParams<{ txRef: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `SMSGlobe Receipt | ${txRef}`;
  }, [txRef]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!txRef) {
        setError("Missing transaction reference");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Find transaction by txRef
        // For now, we'll just show a success message since we don't store detailed receipts
        if (mounted) {
          setTransaction({
            txRef,
            status: 'completed',
            createdAt: new Date()
          });
        }
      } catch (e: any) {
        if (mounted) {
          setError(e?.message || "Failed to load receipt");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [txRef]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-8">
        <header className="max-w-2xl mx-auto mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ReceiptIcon className="h-6 w-6 text-primary" />
            Payment Receipt
          </h1>
          <p className="text-muted-foreground mt-1">Receipt for your top up transaction.</p>
        </header>

        <section className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base">Receipt Details</CardTitle>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="py-10 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="py-6 text-center space-y-3">
                  <p className="font-medium">{error}</p>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Refresh
                    </Button>
                    <Button asChild>
                      <Link to="/transactions">Go to transactions</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
                    <p className="text-muted-foreground">
                      Your top up has been processed and your balance has been updated.
                    </p>
                  </div>

                  <Separator />

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Transaction reference</span>
                      <span className="text-sm font-medium truncate" title={txRef}>
                        {txRef}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Date</span>
                      <span className="text-sm font-medium">
                        {format(new Date(), 'PPP')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="default" className="bg-green-500">Completed</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button className="sm:flex-1" onClick={() => navigate("/dashboard")}>
                      Continue
                    </Button>
                    <Button className="sm:flex-1" variant="outline" asChild>
                      <Link to="/transactions">View history</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}