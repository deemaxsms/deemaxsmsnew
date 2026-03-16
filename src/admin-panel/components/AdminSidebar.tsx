import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Gift,
  CreditCard,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

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

export function AdminSidebar({ collapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const location = useLocation();
  
  // Determine the base path (either /admin or /admin-panel)
  const basePath = location.pathname.startsWith('/admin-panel') ? '/admin-panel' : '/admin';
  
  // Update navigation items with dynamic base path
  const dynamicNavigationItems = navigationItems.map(item => ({
    ...item,
    href: item.href.replace('/admin', basePath)
  }));

  return (
    <div className={cn(
      "relative flex flex-col border-r bg-background transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      "hidden md:flex" // Hide on mobile, show on desktop
    )}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background shadow-md hidden lg:flex"
        onClick={onToggleCollapse}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {dynamicNavigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <span className="truncate font-medium">{item.title}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4 bg-muted/30">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">Admin Panel v1.0</p>
            <p>© 2024 SMS Globe</p>
          </div>
        </div>
      )}
    </div>
  );
}