import { useState, useEffect } from 'react';
import { auth, googleProvider, isFirebaseConfigured, db } from '@/src/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
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
import { Home, LogIn, LogOut, User as UserIcon, Menu, X, AlertCircle, LayoutDashboard, ShieldCheck, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { RoleSelectionModal } from './RoleSelectionModal';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface NavbarProps {
  onNavigate: (page: 'home' | 'dashboard' | 'admin' | 'messages' | 'tenant-dashboard') => void;
  currentPage: 'home' | 'dashboard' | 'admin' | 'messages' | 'tenant-dashboard';
}

export function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);

  const isAdmin = userProfile?.role === 'admin';
  const isAgentOrLandlord = userProfile?.role === 'agent' || userProfile?.role === 'landlord';

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Sync/Fetch profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // Create initial profile if not exists
            const initialProfile = {
              uid: u.uid,
              email: u.email,
              name: u.displayName,
              photoURL: u.photoURL,
              role: 'tenant', // Default role
              verified: false,
              joinedAt: new Date().toISOString(),
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', u.uid), initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.error('Error syncing user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!isFirebaseConfigured()) {
      toast.error("Firebase Not Configured", {
        description: "Please set up Firebase in the AI Studio settings to enable authentication.",
        icon: <AlertCircle className="h-4 w-4" />
      });
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Sync with Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let profile;
      
      if (userDoc.exists()) {
        profile = userDoc.data();
        setUserProfile(profile);
        toast.success(`Welcome back, ${profile.name}!`);
      } else {
        profile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: 'tenant',
          verified: false,
          joinedAt: new Date().toISOString(),
          createdAt: serverTimestamp(),
          isNewUser: true
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), profile);
        setUserProfile(profile);
        setNewUserId(firebaseUser.uid);
        setShowRoleModal(true);
      }
      
      // Redirect based on role
      if (profile.role === 'admin') {
        onNavigate('admin');
      } else if (profile.role === 'agent' || profile.role === 'landlord') {
        onNavigate('dashboard');
      } else if (profile.role === 'tenant') {
        onNavigate('tenant-dashboard');
      } else {
        onNavigate('home');
      }
    } catch (error: any) {
      console.error("Login failed", error);
      toast.error("Login failed. Please try again.");
    }
  };

  const handleRoleSelected = (role: string) => {
    setUserProfile((prev: any) => ({ ...prev, role }));
    if (role === 'agent' || role === 'landlord') {
      onNavigate('dashboard');
    } else {
      onNavigate('home');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      onNavigate('home');
      toast.info("You have been logged out.");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed.");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => onNavigate('home')}
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
              if (!user) handleLogin();
              else if (isAgentOrLandlord) onNavigate('dashboard');
              else setShowRoleModal(true);
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

          {userProfile?.role === 'tenant' && (
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
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    {userProfile && (
                      <Badge variant="outline" className="w-fit mt-1 capitalize text-[10px] h-4">{userProfile.role}</Badge>
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
                {userProfile?.role === 'tenant' && (
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
            <Button onClick={handleLogin} size="sm" className="gap-2">
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

          {userProfile?.role === 'tenant' && (
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
            <Button onClick={handleLogin} className="w-full gap-2">
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

      <RoleSelectionModal 
        isOpen={showRoleModal} 
        onClose={() => setShowRoleModal(false)} 
        userId={newUserId || ''} 
        onRoleSelected={handleRoleSelected}
      />
    </nav>
  );
}
