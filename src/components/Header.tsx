/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import logo from "/favicon.png";
import { Menu, Wallet, Home, ShoppingBag, Receipt, Shield, CreditCard, Settings, User, Crown, LogOut, DollarSign, MessageSquare, ChevronDown, Monitor, Gift, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { UserNotifications } from "@/components/UserNotifications";
import { Badge } from "@/components/ui/badge";
import { userNotificationService } from "@/lib/user-notification-service";



export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [displayBalance, setDisplayBalance] = useState<number>(0);
  const [balanceAnimation, setBalanceAnimation] = useState<'none' | 'decrease' | 'increase'>('none');

  useEffect(() => {
    if (profile?.balance !== undefined) {
      setDisplayBalance(profile.balance);
    }
  }, [profile?.balance]);

  // Listen for real-time balance updates
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const { newBalance, deduction, increase } = event.detail;
      
      if (deduction) {
        // Show decrease animation
        setBalanceAnimation('decrease');
        setTimeout(() => {
          setDisplayBalance(newBalance);
          setTimeout(() => setBalanceAnimation('none'), 500);
        }, 200);
      } else if (increase) {
        // Show increase animation
        setBalanceAnimation('increase');
        setTimeout(() => {
          setDisplayBalance(newBalance);
          setTimeout(() => setBalanceAnimation('none'), 500);
        }, 200);
      } else {
        // Direct update without animation
        setDisplayBalance(newBalance);
      }
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    if (profile) {
      const adminEmails = ["muhammednetrc@gmail.com", "ogunlademichael3@gmail.com"];
      const isUserAdmin = profile.isAdmin === true || (user?.email && adminEmails.includes(user.email));
      setIsAdmin(isUserAdmin);
    }
  }, [profile, user]);

  // Subscribe to notifications for unread count
  useEffect(() => {
    if (!user) return;

    const unsubscribe = userNotificationService.subscribeToUserNotifications(
      user.uid,
      (notifications) => {
        const unread = notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    );

    return unsubscribe;
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const publicNavItems = [
    { to: "/pricing", label: "Pricing" },
    { to: "/sms", label: "SMS" },
    { to: "/vpn-and-proxy", label: "Proxy" },
    { to: "/esim", label: "eSIMs" },
    { to: "/rdp", label: "RDP" },
    { to: "/gifts", label: "Send Gifts" },
    { to: "/how-it-works", label: "How it Works" },
    { to: "/about", label: "About" },
    { to: "/support", label: "Support" },
  ];

  const authNavItems = [
    { to: "/dashboard", label: "Dashboard", icon: Home },
    { to: "/sms", label: "SMS", icon: MessageSquare },
    { to: "/orders", label: "Orders", icon: ShoppingBag },
    { to: "/my-orders", label: "My Gift Orders", icon: Gift },
    { to: "/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { to: "/transactions", label: "Transactions", icon: Receipt },
    { to: "/vpn-and-proxy", label: "Proxy", icon: Shield },
    { to: "/esim", label: "eSIMs", icon: CreditCard },
    { to: "/esim-refill", label: "eSIM Refill", icon: CreditCard },
    { to: "/rdp", label: "RDP", icon: Monitor },
    { to: "/gifts", label: "Send Gifts", icon: Gift },
    { to: "/profile", label: "Profile", icon: User },
    { to: "/support", label: "Support", icon: Settings },
  ];

  const desktopAuthNavItems = user ? authNavItems.filter(item => !['Dashboard', 'Orders', 'My Gift Orders', 'Transactions', 'Profile'].includes(item.label)) : [];

  const MobileBalanceAvatar = () => (
    <div className="flex items-center gap-3">
      {/* Compact Balance with USD Icon */}
      <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-full text-sm">
        <DollarSign className="h-4 w-4 text-primary" />
        <span className={`font-bold transition-all duration-300 ${
          balanceAnimation === 'decrease' ? 'text-red-600 scale-95' : 
          balanceAnimation === 'increase' ? 'text-green-600 scale-105' : ''
        }`}>
          {displayBalance.toFixed(2)}
        </span>
        <span className="text-xs text-muted-foreground">USD</span>
      </div>

      {/* Avatar */}
      <Avatar className="h-9 w-9 ring-2 ring-background">
        <AvatarImage src={(user as any)?.photoURL} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {(user as any)?.displayName?.charAt(0).toUpperCase() ||
            (user as any)?.email?.charAt(0).toUpperCase() ||
            "U"}
        </AvatarFallback>
      </Avatar>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="SMSGlobe" className="h-9 sm:h-10" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {(user ? desktopAuthNavItems : publicNavItems).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm font-medium transition-colors ${
                isActive(item.to)
                  ? "text-foreground underline underline-offset-4 decoration-primary decoration-2"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && user && (
            <Link
              to="/admin"
              className={`text-sm font-medium flex items-center gap-1 transition-colors ${
                isActive("/admin")
                  ? "text-foreground underline underline-offset-4 decoration-primary decoration-2"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Crown className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/top-up">Top Up</Link>
              </Button>
              <div className={`flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md transition-all duration-300 ${
                balanceAnimation === 'decrease' ? 'bg-red-50 border border-red-200' : 
                balanceAnimation === 'increase' ? 'bg-green-50 border border-green-200' : ''
              }`}>
                <Wallet className="h-4 w-4 text-primary" />
                <span className={`text-sm font-bold transition-all duration-300 ${
                  balanceAnimation === 'decrease' ? 'text-red-600 scale-95' : 
                  balanceAnimation === 'increase' ? 'text-green-600 scale-105' : ''
                }`}>
                  ${displayBalance.toFixed(2)} USD
                </span>
              </div>
              <UserNotifications />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 p-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                    <Avatar className="h-9 w-9 ring-2 ring-background">
                      <AvatarImage src={(user as any)?.photoURL || "/assets/resources/avater.png"} />
                      <AvatarFallback>
                        {(user as any)?.displayName?.charAt(0).toUpperCase() ||
                          (user as any)?.email?.charAt(0).toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-black" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {(user as any)?.displayName || (user as any)?.email}
                      </p>
                      {(user as any)?.displayName && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {(user as any)?.email}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders">Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-orders">My Gift Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/esim-refill">eSIM Refill</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/transactions">Transactions</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" className="shadow-md" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile: Avatar + Balance (compact) + Menu */}
        <div className="flex items-center gap-3 md:hidden">
          {user && <MobileBalanceAvatar />}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 flex flex-col">
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>Main navigation and account options</SheetDescription>
              </VisuallyHidden>

              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 px-2">
                  <Link to="/" className="flex items-center gap-2">
                    <img src={logo} alt="SMSGlobe" className="h-8" />
                  </Link>
                </div>

                {/* User Balance Section */}
                {user && (
                  <div className="mb-4 px-2">
                    <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={(user as any)?.photoURL} />
                        <AvatarFallback className="text-sm">
                          {(user as any)?.displayName?.charAt(0).toUpperCase() ||
                            (user as any)?.email?.charAt(0).toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Account Balance</p>
                        <p className={`text-lg font-bold truncate transition-all duration-300 ${
                          balanceAnimation === 'decrease' ? 'text-red-600 scale-95' : 
                          balanceAnimation === 'increase' ? 'text-green-600 scale-105' : ''
                        }`}>
                          ${displayBalance.toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scrollable Navigation */}
                <div className="flex-1 overflow-y-auto px-2">
                  <nav className="space-y-1 pb-4">
                    {(user ? authNavItems : publicNavItems).map((item) => {
                      const Icon = (item as any).icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive(item.to)
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                          <span className="truncate">{item.label}</span>
                          {(item as any).badge > 0 && (
                            <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                              {(item as any).badge > 99 ? '99+' : (item as any).badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                    {isAdmin && user && (
                      <Link
                        to="/admin"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive("/admin")
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Crown className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Admin</span>
                      </Link>
                    )}
                  </nav>
                </div>

                {/* Fixed Bottom Actions */}
                <div className="border-t pt-4 space-y-2 px-2 pb-2">
                  {user ? (
                    <>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to="/top-up">Top Up Balance</Link>
                      </Button>
                      <Button variant="destructive" size="sm" className="w-full gap-2" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to="/login">Login</Link>
                      </Button>
                      <Button size="sm" className="w-full shadow-md" asChild>
                        <Link to="/signup">Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};