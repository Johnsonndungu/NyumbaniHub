import { useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '@/src/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  MessageSquare, 
  Heart, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  User,
  Search,
  ArrowRight,
  Loader2,
  Calendar,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface Application {
  id: string;
  propertyId: string;
  propertyTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  message: string;
}

interface TenantDashboardProps {
  onNavigate: (page: 'home' | 'dashboard' | 'admin' | 'messages' | 'tenant-dashboard') => void;
}

export function TenantDashboard({ onNavigate }: TenantDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'saved' | 'settings'>('overview');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchTenantData(u.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchTenantData = async (userId: string) => {
    if (!isFirebaseConfigured()) return;
    
    try {
      const appsRef = collection(db, 'applications');
      const q = query(appsRef, where('tenantId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      setApplications(data);
    } catch (err) {
      console.error('Error fetching tenant data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Please sign in to view your dashboard</h2>
        <Button onClick={() => window.location.reload()}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-2">
          <div className="p-4 mb-6 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                {user.displayName?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold truncate">{user.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <Badge variant="outline" className="w-full justify-center capitalize">Tenant Account</Badge>
          </div>

          <nav className="space-y-1">
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('overview')}
              className={`w-full justify-start gap-3 ${activeTab === 'overview' ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-slate-600'}`}
            >
              <Home className="h-4 w-4" /> Overview
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('applications')}
              className={`w-full justify-start gap-3 ${activeTab === 'applications' ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-slate-600'}`}
            >
              <Clock className="h-4 w-4" /> My Applications
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('saved')}
              className={`w-full justify-start gap-3 ${activeTab === 'saved' ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-slate-600'}`}
            >
              <Heart className="h-4 w-4" /> Saved Properties
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('messages')}
              className="w-full justify-start gap-3 text-slate-600"
            >
              <MessageSquare className="h-4 w-4" /> Messages
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('settings')}
              className={`w-full justify-start gap-3 ${activeTab === 'settings' ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-slate-600'}`}
            >
              <Settings className="h-4 w-4" /> Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Applied</p>
                        <h3 className="text-2xl font-bold">{applications.length}</h3>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <Clock className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Approved</p>
                        <h3 className="text-2xl font-bold">
                          {applications.filter(a => a.status === 'approved').length}
                        </h3>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Saved</p>
                        <h3 className="text-2xl font-bold">0</h3>
                      </div>
                      <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                        <Heart className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Applications</CardTitle>
                    <CardDescription>Track your latest house requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {applications.length > 0 ? (
                        applications.slice(0, 3).map(app => (
                          <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-bold text-sm">{app.propertyTitle}</p>
                              <p className="text-xs text-slate-500">
                                {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : new Date(app.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-slate-500 text-sm mb-4">You haven't applied for any houses yet.</p>
                          <Button variant="outline" size="sm" onClick={() => onNavigate('home')}>
                            Browse Properties
                          </Button>
                        </div>
                      )}
                    </div>
                    {applications.length > 3 && (
                      <Button variant="link" className="w-full mt-4" onClick={() => setActiveTab('applications')}>
                        View All Applications
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-primary text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Search className="h-32 w-32" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-white">Find Your Next Home</CardTitle>
                    <CardDescription className="text-primary-foreground/80">
                      Explore thousands of verified listings in your favorite neighborhoods.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <Button 
                      variant="secondary" 
                      className="w-full gap-2"
                      onClick={() => onNavigate('home')}
                    >
                      Start Searching <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Applications</h2>
                <Badge variant="outline">{applications.length} Total</Badge>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {applications.length > 0 ? (
                  applications.map(app => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg">{app.propertyTitle}</h3>
                                {getStatusBadge(app.status)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> Applied on {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : new Date(app.createdAt).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> Nairobi, Kenya
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg italic">
                                "{app.message}"
                              </p>
                            </div>
                            <div className="flex flex-row md:flex-col gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => onNavigate('messages')}>
                                <MessageSquare className="h-4 w-4 mr-2" /> Chat with Agent
                              </Button>
                              <Button variant="ghost" size="sm" className="text-slate-500">
                                View Property
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
                    <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">No Applications Found</h3>
                    <p className="text-slate-500 mb-6">Start applying for houses to see them here.</p>
                    <Button onClick={() => onNavigate('home')}>Browse Properties</Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
              <Heart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Your Wishlist is Empty</h3>
              <p className="text-slate-500 mb-6">Save properties you like to keep track of them.</p>
              <Button onClick={() => onNavigate('home')}>Explore Properties</Button>
            </div>
          )}

          {activeTab === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <input 
                      className="w-full p-2 border rounded-lg" 
                      defaultValue={user.displayName} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <input 
                      className="w-full p-2 border rounded-lg bg-slate-50" 
                      defaultValue={user.email} 
                      disabled 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <input 
                      className="w-full p-2 border rounded-lg" 
                      placeholder="+254 700 000 000" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preferred Location</label>
                    <input 
                      className="w-full p-2 border rounded-lg" 
                      placeholder="e.g., Kilimani, Westlands" 
                    />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button className="gap-2">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
