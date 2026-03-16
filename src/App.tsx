import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Transactions from "./pages/Transactions";
import Receipt from "./pages/Receipt";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Esim from "./pages/Esim";
import { ESimRefill } from "./pages/ESimRefill";
import ProductDetail from "./pages/ProductDetail";
import Orders from "./pages/Orders";
import TopUp from "./pages/TopUp";
import VpnAndProxy from "./pages/VpnAndProxy";
import ProviderProducts from "./pages/ProviderProducts";
import EsimCategories from "./pages/EsimCategories";
import EsimCategoryProducts from "./pages/EsimCategoryProducts";
import SMSOrders from "./pages/SMSOrders";
import Marketplace from "./pages/Marketplace";
import RDPProducts from "./pages/RDPProducts";
import GiftCardProducts from "./pages/GiftCardProducts";
import GiftCatalog from "./pages/GiftCatalog";
import GiftDetail from "./pages/GiftDetail";
import GiftTracking from "./pages/GiftTracking";
import MyOrders from "./pages/MyOrders";
import CustomGiftRequest from "./pages/CustomGiftRequest";
import Support from "./pages/Support";
import NotificationsPage from "./pages/Notifications";
import PaviorWidget from "./components/PaviorWidget";
import { AdminApp } from "./admin-panel/AdminApp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PaviorWidget />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="/admin-panel/*" element={<AdminApp />} />
            <Route path="/esim" element={<Esim />} />
            <Route path="/esim-refill" element={<ESimRefill />} />
            <Route path="/esim-categories" element={<EsimCategories />} />
            <Route path="/esim-category/:category" element={<EsimCategoryProducts />} />
            <Route path="/vpn-and-proxy" element={<VpnAndProxy />} />
            <Route path="/rdp" element={<RDPProducts />} />
            <Route path="/rdp/:subcategory" element={<RDPProducts />} />
            <Route path="/gift-cards" element={<GiftCardProducts />} />
            <Route path="/gift-cards/:subcategory" element={<GiftCardProducts />} />
            <Route path="/gifts" element={<GiftCatalog />} />
            <Route path="/gift/:slug" element={<GiftDetail />} />
            <Route path="/gift-tracking/:trackingCode" element={<GiftTracking />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/custom-gift-request" element={<CustomGiftRequest />} />
            <Route path="/sms" element={<SMSOrders />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/provider/:provider" element={<ProviderProducts />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/top-up" element={<TopUp />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/receipt/:txRef" element={<Receipt />} />
            <Route path="/support" element={<Support />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
