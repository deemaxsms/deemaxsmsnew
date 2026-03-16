import { Routes, Route, Navigate, useLocation, NavLink } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './auth/AdminAuthContext';
import { AdminLogin } from './auth/AdminLogin';
import { AdminForgotPassword } from './auth/AdminForgotPassword';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminDashboard } from './pages/AdminDashboard';
import { UsersManagement } from './pages/UsersManagement';
import { ProductsManagement } from './pages/ProductsManagement';
import { OrdersManagement } from './pages/OrdersManagement';
import { GiftsManagement } from './pages/GiftsManagement';
import { TransactionsManagement } from './pages/TransactionsManagement';
import { SettingsManagement } from './pages/SettingsManagement';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { AdminProfile } from './pages/AdminProfile';
import { NotificationsPage } from './pages/NotificationsPage';
import { SMSManagement } from './pages/SMSManagement';
import { ESimRefillManagement } from './pages/ESimRefillManagement';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { AdminFooter } from './components/AdminFooter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, LayoutDashboard, Users, Package, ShoppingCart, Gift, CreditCard, Settings, BarChart3, MessageSquare, Smartphone } from 'lucide-react';
import { useState } from 'react';


const navigationItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Gifts',
    href: '/admin/gifts',
    icon: Gift,
  },
  {
    title: 'Transactions',
    href: '/admin/transactions',
    icon: CreditCard,
  },
  {
    title: 'SMS Management',
    href: '/admin/sms-management',
    icon: MessageSquare,
  },
  {
    title: 'eSIM Refills',
    href: '/admin/esim-refills',
    icon: Smartphone,
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />
      <div className="flex">
        {/* Desktop Sidebar */}
        <AdminSidebar 
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-background border-r shadow-xl">
              <div className="p-4 border-b bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <h2 className="font-semibold text-lg">Admin Panel</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="h-8 w-8"
                  >
                    <span className="sr-only">Close menu</span>
                    ×
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 px-4 py-6">
                <nav className="space-y-1">
                  {navigationItems.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href.replace('/admin', '/admin')}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  ))}
                </nav>
              </ScrollArea>
              
              {/* Mobile Menu Footer */}
              <div className="border-t p-4 bg-muted/30">
                <div className="text-xs text-muted-foreground text-center">
                  <p className="font-medium">Admin Panel v1.0</p>
                  <p>© 2024 SMS Globe</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <main className="flex-1 min-w-0 p-2 sm:p-4 lg:p-6 overflow-x-hidden">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
      <AdminFooter />
    </div>
  );
}

function AdminRoutes() {
  const { user, loading, isAdmin } = useAdminAuth();
  const location = useLocation();
  
  // Determine the base path (either /admin or /admin-panel)
  const basePath = location.pathname.startsWith('/admin-panel') ? '/admin-panel' : '/admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLogin />;
  }

  return (
    <AdminLayout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to={`${basePath}/dashboard`} replace />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/products" element={<ProductsManagement />} />
          <Route path="/orders" element={<OrdersManagement />} />
          <Route path="/gifts" element={<GiftsManagement />} />
          <Route path="/transactions" element={<TransactionsManagement />} />
          <Route path="/sms-management" element={<SMSManagement />} />
          <Route path="/esim-refills" element={<ESimRefillManagement />} />
          <Route path="/settings" element={<SettingsManagement />} />
          <Route path="/reports" element={<ReportsAnalytics />} />
          <Route path="/profile" element={<AdminProfile />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </ErrorBoundary>
    </AdminLayout>
  );
}

export function AdminApp() {
  return (
    <ErrorBoundary>
      <AdminAuthProvider>
        <AdminRoutes />
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}