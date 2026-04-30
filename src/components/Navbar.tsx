import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, LogIn, LogOut, User as UserIcon, Menu, X, LayoutDashboard, ShieldCheck, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { api } from '@/src/services/api';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  onNavigate: (page: 'landing' | 'home' | 'dashboard' | 'admin' | 'messages' | 'tenant-dashboard') => void;
  currentPage: 'landing' | 'home' | 'dashboard' | 'admin' | 'messages' | 'tenant-dashboard';
}

export function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isAgentOrLandlord = user?.role === 'agent' || user?.role === 'landlord';

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    // Redirect based on role
    if (userData.role === 'admin') {
      onNavigate('admin');
    } else if (userData.role === 'agent' || userData.role === 'landlord') {
      onNavigate('dashboard');
    } else if (userData.role === 'tenant') {
      onNavigate('tenant-dashboard');
    } else {
      onNavigate('home');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    onNavigate('landing');
    toast.info("You have been logged out.");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => onNavigate('landing')}
        >
          <Home className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-primary">Nyumbani<span className="text-foreground">Hub</span></span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => onNavigate('home')}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              currentPage === 'home' ? "text-primary" : "text-slate-600"
            )}
          >
            Find a House
          </button>
          <button 
            onClick={() => {
              if (!user) setShowAuthModal(true);
              else if (isAgentOrLandlord) onNavigate('dashboard');
              else onNavigate('home');
            }}
            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
          >
            List Your Property
          </button>
          <button className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Agents</button>
          
          {user && (
            <button 
              onClick={() => onNavigate('messages')}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                currentPage === 'messages' ? "text-primary" : "text-slate-600"
              )}
            >
              Messages
            </button>
          )}

          {isAgentOrLandlord && (
            <button 
              onClick={() => onNavigate('dashboard')}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                currentPage === 'dashboard' ? "text-primary" : "text-slate-600"
              )}
            >
              Agent Dashboard
            </button>
          )}

          {user?.role === 'tenant' && (
            <button 
              onClick={() => onNavigate('tenant-dashboard')}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                currentPage === 'tenant-dashboard' ? "text-primary" : "text-slate-600"
              )}
            >
              My Dashboard
            </button>
          )}

          {isAdmin && (
            <button 
              onClick={() => onNavigate('admin')}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                currentPage === 'admin' ? "text-primary" : "text-slate-600"
              )}
            >
              Admin
            </button>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              }>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      {user.isVerified && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    {user && (
                      <Badge variant="outline" className="w-fit mt-1 capitalize text-[10px] h-4">{user.role}</Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => onNavigate('admin')}>
                    <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onNavigate('messages')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Messages</span>
                </DropdownMenuItem>
                {isAgentOrLandlord && (
                  <DropdownMenuItem onClick={() => onNavigate('dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Agent Dashboard</span>
                  </DropdownMenuItem>
                )}
                {user?.role === 'tenant' && (
                  <DropdownMenuItem onClick={() => onNavigate('tenant-dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>My Dashboard</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setShowAuthModal(true)} size="sm" className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-4">
           {user && (
             <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
             </Avatar>
           )}
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-4 animate-in slide-in-from-top duration-300">
          <button 
            onClick={() => { onNavigate('home'); setIsMenuOpen(false); }}
            className="block w-full text-left text-sm font-medium py-2"
          >
            Find a House
          </button>
          <button className="block w-full text-left text-sm font-medium py-2">List Your Property</button>
          <button className="block w-full text-left text-sm font-medium py-2">Agents</button>
          
          {user && (
            <button 
              onClick={() => { onNavigate('messages'); setIsMenuOpen(false); }}
              className="block w-full text-left text-sm font-medium py-2 text-primary"
            >
              Messages
            </button>
          )}

          {isAgentOrLandlord && (
            <button 
              onClick={() => { onNavigate('dashboard'); setIsMenuOpen(false); }}
              className="block w-full text-left text-sm font-medium py-2 text-primary"
            >
              Agent Dashboard
            </button>
          )}

          {user?.role === 'tenant' && (
            <button 
              onClick={() => { onNavigate('tenant-dashboard'); setIsMenuOpen(false); }}
              className="block w-full text-left text-sm font-medium py-2 text-primary"
            >
              My Dashboard
            </button>
          )}

          {isAdmin && (
            <button 
              onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }}
              className="block w-full text-left text-sm font-medium py-2 text-primary"
            >
              Admin Dashboard
            </button>
          )}

          {!user && (
            <Button onClick={() => { setShowAuthModal(true); setIsMenuOpen(false); }} className="w-full gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
          {user && (
            <Button onClick={handleLogout} variant="outline" className="w-full gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          )}
        </div>
      )}

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleLoginSuccess}
      />
    </nav>
  );
}
