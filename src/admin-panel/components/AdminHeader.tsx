import { Search, Settings, User, LogOut, Menu, X, Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { NotificationCenter } from './NotificationCenter';
import { GlobalSearch } from './GlobalSearch';
import { MobileSearch } from './MobileSearch';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { notificationService } from '../lib/notification-service';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export function AdminHeader({ onToggleSidebar, onMobileMenuToggle, mobileMenuOpen }: AdminHeaderProps) {
  const { user, profile, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Determine the base path (either /admin or /admin-panel)
  const basePath = location.pathname.startsWith('/admin-panel') ? '/admin-panel' : '/admin';

  // Subscribe to notifications for mobile badge
  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const updateNotificationCount = () => {
      // This is a simplified count - in a real app you'd track read/unread status
      let count = 0;
      
      const unsubscribeOrders = notificationService.subscribeToNewOrders((orders) => {
        count += Math.min(orders.length, 5);
        setNotificationCount(count);
      });

      const unsubscribeGifts = notificationService.subscribeToGiftRequests((requests) => {
        const pendingRequests = requests.filter(r => !r.adminResponse || r.adminResponse.status === 'pending');
        count += Math.min(pendingRequests.length, 5);
        setNotificationCount(count);
      });

      unsubscribes = [unsubscribeOrders, unsubscribeGifts];
    };

    updateNotificationCount();

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side - Mobile Menu Button, Logo and Search */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileMenuToggle}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold">Admin Panel</h1>
          </div>
          
          <div className="hidden lg:block">
            <GlobalSearch />
          </div>
        </div>

        {/* Right side - Actions and Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Search Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Notifications - Desktop only */}
          <div className="hidden sm:block">
            <NotificationCenter />
          </div>

          {/* Settings - Hidden on mobile */}
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Settings className="w-5 h-5" />
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'Admin'} />
                  <AvatarFallback className="text-xs sm:text-sm">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName || 'Admin User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  {profile?.isAdmin && (
                    <Badge variant="secondary" className="w-fit text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Mobile-only menu items */}
              <div className="sm:hidden">
                <DropdownMenuItem onClick={() => setMobileSearchOpen(true)}>
                  <Search className="mr-2 h-4 w-4" />
                  <span>Search</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`${basePath}/notifications`)}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      {notificationCount > 0 ? (
                        <BellRing className="mr-2 h-4 w-4" />
                      ) : (
                        <Bell className="mr-2 h-4 w-4" />
                      )}
                      <span>Notifications</span>
                    </div>
                    {notificationCount > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </div>
              
              <DropdownMenuItem onClick={() => navigate(`${basePath}/profile`)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Dialog */}
      <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>
              Search pages, users, orders, and more
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <MobileSearch onClose={() => setMobileSearchOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}