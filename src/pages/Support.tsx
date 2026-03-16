/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { firestoreService, ProductOrder, ProductCategory } from "@/lib/firestore-service";
import { toast } from "sonner";
import {
  MessageCircle,
  Search,
  FileText,
  HelpCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  User,
  Package,
  Wifi,
  Globe,
  Shield,
  Monitor,
  Gift,
  Copy,
  ExternalLink,
  Bot,
  Zap,
  Headphones,
  BookOpen,
  MessageSquare,
  Ticket,
  Eye,
  RefreshCw
} from "lucide-react";

const categoryIcons: Record<ProductCategory, React.ReactNode> = {
  esim: <Wifi className="h-4 w-4" />,
  proxy: <Globe className="h-4 w-4" />,
  vpn: <Shield className="h-4 w-4" />,
  rdp: <Monitor className="h-4 w-4" />,
  gift: <Gift className="h-4 w-4" />,
};

const statusConfig = {
  pending: { icon: Clock, label: "Pending", color: "bg-yellow-500" },
  processing: { icon: AlertCircle, label: "Processing", color: "bg-blue-500" },
  completed: { icon: CheckCircle, label: "Completed", color: "bg-green-500" },
  cancelled: { icon: AlertCircle, label: "Cancelled", color: "bg-red-500" },
  refunded: { icon: AlertCircle, label: "Refunded", color: "bg-orange-500" },
};

interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  description: string;
  orderId?: string;
  messages: SupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isStaff: boolean;
}

const Support = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOrderId, setSearchOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);

  // Support Ticket State
  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "",
    priority: "medium" as const,
    description: "",
    orderId: ""
  });
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load orders from firestore service (regular orders)
      const userOrders = await firestoreService.getUserProductOrders(user.uid);
      setOrders(userOrders);

      // Load support tickets (mock data for now)
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          userId: user.uid,
          subject: 'eSIM activation issue',
          category: 'esim',
          priority: 'high',
          status: 'in-progress',
          description: 'My eSIM is not activating properly',
          orderId: 'order_123',
          messages: [
            {
              id: '1',
              senderId: user.uid,
              senderName: user.email || 'User',
              message: 'My eSIM is not activating properly',
              timestamp: new Date(Date.now() - 86400000),
              isStaff: false
            },
            {
              id: '2',
              senderId: 'staff_1',
              senderName: 'Support Team',
              message: 'We\'re looking into this issue. Please try restarting your device and ensure you have a stable internet connection.',
              timestamp: new Date(Date.now() - 43200000),
              isStaff: true
            }
          ],
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 43200000)
        }
      ];
      setTickets(mockTickets);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load support data');
    } finally {
      setLoading(false);
    }
  };

  const searchOrder = async () => {
    if (!searchOrderId.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    const order = orders.find(o => o.id === searchOrderId || o.id.includes(searchOrderId));
    if (order) {
      setSelectedOrder(order);
      toast.success('Order found!');
    } else {
      setSelectedOrder(null);
      toast.error('Order not found');
    }
  };

  const submitSupportTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingTicket(true);
    try {
      // In a real app, this would save to Firestore
      const ticket: SupportTicket = {
        id: Date.now().toString(),
        userId: user!.uid,
        subject: newTicket.subject,
        category: newTicket.category,
        priority: newTicket.priority,
        status: 'open',
        description: newTicket.description,
        orderId: newTicket.orderId || undefined,
        messages: [
          {
            id: '1',
            senderId: user!.uid,
            senderName: user!.email || 'User',
            message: newTicket.description,
            timestamp: new Date(),
            isStaff: false
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setTickets(prev => [ticket, ...prev]);
      setNewTicket({
        subject: "",
        category: "",
        priority: "medium",
        description: "",
        orderId: ""
      });

      toast.success('Support ticket submitted successfully!');
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Failed to submit support ticket');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const faqs = [
    {
      question: "How do I activate my eSIM?",
      answer: "After purchasing, go to your device settings, find the eSIM section, and scan the QR code provided in your order details."
    },
    {
      question: "My VPN connection is slow",
      answer: "Try connecting to a different server location, check your internet speed, or restart your VPN application."
    },
    {
      question: "How do I check my order status?",
      answer: "Use the Order Tracking section above or check your order history in the dashboard."
    },
    {
      question: "Can I cancel my order?",
      answer: "Orders can be cancelled within 30 minutes of purchase. Contact support for assistance."
    },
    {
      question: "How do I top up my balance?",
      answer: "Go to your dashboard and click the 'Top Up' button, or use the balance card in the header."
    }
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading support...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Support Center</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Get help with your orders, track issues, and connect with our support team
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="orders" className="text-xs sm:text-sm">Orders</TabsTrigger>
              <TabsTrigger value="tickets" className="text-xs sm:text-sm">Tickets</TabsTrigger>
              <TabsTrigger value="faq" className="text-xs sm:text-sm">FAQ</TabsTrigger>
              <TabsTrigger value="contact" className="text-xs sm:text-sm">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab("orders")}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Track Order
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab("tickets")}
                    >
                      <Ticket className="h-4 w-4 mr-2" />
                      Submit Ticket
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        // Trigger Pavior chat widget
                        if (typeof window !== 'undefined' && window.Pavior) {
                          window.Pavior('show');
                        } else {
                          toast.info("Live chat is loading... Please try again in a moment.");
                        }
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Live Chat
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Recent Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orders.slice(0, 3).length > 0 ? (
                      <div className="space-y-3">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {categoryIcons[order.category]}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{order.productName}</p>
                                <p className="text-xs text-muted-foreground">#{order.id}</p>
                              </div>
                            </div>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="self-start sm:self-center">
                              {order.status}
                            </Badge>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setActiveTab("orders")}
                        >
                          View All Orders 
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No recent orders</p>
                    )}
                  </CardContent>
                </Card>

                {/* Support Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Headphones className="h-5 w-5" />
                      Support Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Open Tickets</span>
                      <Badge variant="destructive">{tickets.filter(t => t.status === 'open').length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Response Time</span>
                      <span className="text-sm font-medium">2.3 hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Resolution Rate</span>
                      <span className="text-sm font-medium">94%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Tracking</CardTitle>
                  <CardDescription>
                    Search for your orders by order ID or order number
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Enter order ID or order number"
                      value={searchOrderId}
                      onChange={(e) => setSearchOrderId(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
                      className="flex-1"
                    />
                    <Button onClick={searchOrder} className="w-full sm:w-auto">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>

                  {selectedOrder && (
                    <Card className="mt-4">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Order Details</CardTitle>
                          <Badge variant={selectedOrder.status === 'completed' ? 'default' : 'secondary'}>
                            {selectedOrder.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Order Number</Label>
                            <p className="font-mono text-sm">{selectedOrder.orderNumber}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Product</Label>
                            <p>{selectedOrder.productName}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Amount</Label>
                            <p>${selectedOrder.amount.toFixed(2)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Date</Label>
                            <p>{selectedOrder.createdAt.toLocaleDateString()}</p>
                          </div>
                        </div>

                        {selectedOrder.deliveryInfo && (
                          <div>
                            <Label className="text-sm font-medium">Delivery Information</Label>
                            <div className="mt-2 p-3 bg-muted rounded">
                              <pre className="text-sm whitespace-pre-wrap">
                                {JSON.stringify(selectedOrder.deliveryInfo, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedOrder.id);
                              toast.success('Order number copied!');
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Order ID
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => setActiveTab("tickets")}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact Support
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Create New Ticket */}
                <Card>
                  <CardHeader>
                    <CardTitle>Submit Support Ticket</CardTitle>
                    <CardDescription>
                      Create a new support ticket for assistance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        placeholder="Brief description of your issue"
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newTicket.category}
                        onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="esim">eSIM</SelectItem>
                          <SelectItem value="vpn">VPN</SelectItem>
                          <SelectItem value="proxy">Proxy</SelectItem>
                          <SelectItem value="rdp">RDP</SelectItem>
                          <SelectItem value="gift">Gift</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={newTicket.priority}
                        onValueChange={(value: any) => setNewTicket(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="orderId">Related Order ID (optional)</Label>
                      <Input
                        id="orderId"
                        placeholder="If this relates to a specific order"
                        value={newTicket.orderId}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, orderId: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Please provide detailed information about your issue"
                        rows={4}
                        value={newTicket.description}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <Button
                      onClick={submitSupportTicket}
                      disabled={isSubmittingTicket}
                      className="w-full"
                    >
                      {isSubmittingTicket ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing Tickets */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Support Tickets</CardTitle>
                    <CardDescription>
                      View and manage your support tickets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tickets.length > 0 ? (
                      <div className="space-y-3">
                        {tickets.map((ticket) => (
                          <div key={ticket.id} className="p-3 sm:p-4 border rounded space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h4 className="font-medium text-sm sm:text-base truncate">{ticket.subject}</h4>
                              <Badge variant={
                                ticket.status === 'open' ? 'destructive' :
                                ticket.status === 'in-progress' ? 'default' :
                                ticket.status === 'resolved' ? 'secondary' : 'outline'
                              } className="self-start sm:self-center">
                                {ticket.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-muted-foreground">
                              <span>{ticket.createdAt.toLocaleDateString()}</span>
                              <span>{ticket.messages.length} messages</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No support tickets yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    Find answers to common questions and issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {faqs.map((faq, index) => (
                      <details key={index} className="border rounded p-4">
                        <summary className="font-medium cursor-pointer hover:text-primary">
                          {faq.question}
                        </summary>
                        <p className="mt-2 text-muted-foreground">{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Email Support</p>
                        <p className="text-sm text-muted-foreground">support@smsglobe.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Live Chat</p>
                        <p className="text-sm text-muted-foreground">Available 24/7 via Pavior</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Response Time</p>
                        <p className="text-sm text-muted-foreground">Within 2 hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Additional Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      User Guide
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      API Documentation
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      System Status
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Support;