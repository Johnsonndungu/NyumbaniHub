import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  ShieldOff,
  Users, 
  Home, 
  BarChart3, 
  Search, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  AlertTriangle,
  Mail,
  Calendar,
  Loader2,
  Trash2,
  UserCog,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from '@/src/services/api';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: 'agent' | 'landlord' | 'tenant' | 'admin';
  verified: boolean;
  joinedAt: any;
}

interface Stats {
  totalUsers: number;
  totalProperties: number;
  pendingVerifications: number;
  totalRevenue: number;
}

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
  ownerId: string;
  images: string[];
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'verifications' | 'properties'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState({ subject: '', content: '', target: 'all' });

  const fetchData = async () => {
    try {
      const usersData = await api.getUsers();
      const propsData = await api.getProperties();
      
      const safeUsers = Array.isArray(usersData) ? usersData : [];
      const safeProps = Array.isArray(propsData) ? propsData : [];
      
      setUsers(safeUsers);
      setProperties(safeProps);
      
      setStats({
        totalUsers: safeUsers.length,
        totalProperties: safeProps.length,
        pendingVerifications: safeUsers.filter((u: any) => !u.isVerified && (u.role === 'agent' || u.role === 'landlord')).length,
        totalRevenue: safeProps.reduce((acc: number, p: any) => acc + (p.price * 0.05), 0)
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyUser = async (userId: string, status: boolean) => {
    try {
      await api.updateUser(userId, { verified: status });
      toast.success(status ? 'User verified successfully' : 'Verification removed');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await api.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property listing?')) return;
    
    try {
      await api.deleteProperty(propertyId);
      toast.success('Property deleted successfully');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete property');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await api.updateUser(userId, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update role');
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.subject || !broadcastMessage.content) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      const currentUser = api.getCurrentUser();
      await api.sendBroadcast({
        ...broadcastMessage,
        senderId: currentUser?.id
      });
      
      toast.success(`Broadcast sent to ${broadcastMessage.target} users!`);
      setIsBroadcastOpen(false);
      setBroadcastMessage({ subject: '', content: '', target: 'all' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send broadcast');
    }
  };

  const filteredUsers = users.filter(user => 
    (user.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:block">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-primary">Admin Central</h2>
        </div>
        <nav className="p-4 space-y-1">
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('overview')}
            className={`w-full justify-start gap-3 hover:bg-slate-800 hover:text-white ${activeTab === 'overview' ? 'bg-slate-800 text-primary' : 'text-slate-400'}`}
          >
            <BarChart3 className="h-4 w-4" /> Overview
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('users')}
            className={`w-full justify-start gap-3 hover:bg-slate-800 hover:text-white ${activeTab === 'users' ? 'bg-slate-800 text-primary' : 'text-slate-400'}`}
          >
            <Users className="h-4 w-4" /> User Management
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('properties')}
            className={`w-full justify-start gap-3 hover:bg-slate-800 hover:text-white ${activeTab === 'properties' ? 'bg-slate-800 text-primary' : 'text-slate-400'}`}
          >
            <Home className="h-4 w-4" /> Properties
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('verifications')}
            className={`w-full justify-start gap-3 hover:bg-slate-800 hover:text-white ${activeTab === 'verifications' ? 'bg-slate-800 text-primary' : 'text-slate-400'}`}
          >
            <ShieldCheck className="h-4 w-4" /> Verifications
            {stats && stats.pendingVerifications > 0 && (
              <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center rounded-full">
                {stats.pendingVerifications}
              </Badge>
            )}
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Administration</h1>
            <p className="text-slate-500">Manage users, verify agents, and monitor platform growth.</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" /> Broadcast Message
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Broadcast Message</DialogTitle>
                  <DialogDescription>
                    Send an email notification to all or specific platform users.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select 
                      value={broadcastMessage.target} 
                      onValueChange={(v) => setBroadcastMessage({...broadcastMessage, target: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="agent">Agents Only</SelectItem>
                        <SelectItem value="landlord">Landlords Only</SelectItem>
                        <SelectItem value="tenant">Tenants Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input 
                      placeholder="e.g., Platform Maintenance Update" 
                      value={broadcastMessage.subject}
                      onChange={(e) => setBroadcastMessage({...broadcastMessage, subject: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message Content</Label>
                    <Textarea 
                      placeholder="Write your message here..." 
                      className="min-h-[150px]"
                      value={broadcastMessage.content}
                      onChange={(e) => setBroadcastMessage({...broadcastMessage, content: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBroadcastOpen(false)}>Cancel</Button>
                  <Button onClick={handleSendBroadcast} className="gap-2">
                    <Send className="h-4 w-4" /> Send Broadcast
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Users</p>
                      <h3 className="text-2xl font-bold">{stats?.totalUsers}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Properties</p>
                      <h3 className="text-2xl font-bold">{stats?.totalProperties}</h3>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                      <Home className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Pending Verification</p>
                      <h3 className="text-2xl font-bold">{stats?.pendingVerifications}</h3>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Est. Revenue</p>
                      <h3 className="text-2xl font-bold">KSh {(stats?.totalRevenue || 0).toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {users.slice(0, 5).map(user => (
                      <div key={user.id} className="py-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                              {(user.displayName || 'U').charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{user.displayName || 'Anonymous'}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="capitalize">{user.role}</Badge>
                          {user.verified ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Verified</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="link" className="w-full mt-4" onClick={() => setActiveTab('users')}>View All Users</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">Verification Backlog</p>
                      <p className="text-xs text-amber-700">There are {stats?.pendingVerifications} agents waiting for document verification.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-900">Monthly Report</p>
                      <p className="text-xs text-blue-700">March 2026 performance report is now ready for review.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Directory</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-8" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-slate-500 text-sm">
                      <th className="pb-4 font-medium">User</th>
                      <th className="pb-4 font-medium">Role</th>
                      <th className="pb-4 font-medium">Verification</th>
                      <th className="pb-4 font-medium">Joined</th>
                      <th className="pb-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4">
                          <div className="font-bold text-slate-900">{user.displayName || 'Anonymous'}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="py-4">
                          <Badge variant="outline" className="capitalize">{user.role}</Badge>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {user.verified ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Verified</Badge>
                            ) : (
                              <Badge variant="secondary">Unverified</Badge>
                            )}
                            {(user.role === 'agent' || user.role === 'landlord') && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 hover:bg-slate-100"
                                onClick={() => handleVerifyUser(user.id, !user.verified)}
                                title={user.verified ? "Revoke Verification" : "Verify User"}
                              >
                                {user.verified ? (
                                  <ShieldOff className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ShieldCheck className="h-4 w-4 text-primary" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-slate-600">
                          {user.joinedAt?.toDate ? user.joinedAt.toDate().toLocaleDateString() : new Date(user.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleVerifyUser(user.id, !user.verified)}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                {user.verified ? 'Revoke Verification' : 'Verify User'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">Change Role</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'tenant')}>
                                <Users className="mr-2 h-4 w-4" /> Tenant
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'agent')}>
                                <ShieldCheck className="mr-2 h-4 w-4" /> Agent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'landlord')}>
                                <Home className="mr-2 h-4 w-4" /> Landlord
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'verifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Pending Verifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {users.filter(u => !u.verified && (u.role === 'agent' || u.role === 'landlord')).length > 0 ? (
                users.filter(u => !u.verified && (u.role === 'agent' || u.role === 'landlord')).map(user => (
                  <Card key={user.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                            {(user.displayName || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.displayName || 'Anonymous'}</div>
                            <div className="text-xs text-slate-500 capitalize">{user.role} Account</div>
                          </div>
                        </div>
                        <Badge variant="secondary">Pending Review</Badge>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="h-4 w-4" /> {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-4 w-4" /> Joined {user.joinedAt?.toDate ? user.joinedAt.toDate().toLocaleDateString() : new Date(user.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          className="flex-1 gap-2" 
                          onClick={() => handleVerifyUser(user.id, true)}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2 text-destructive hover:text-destructive">
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed">
                  <ShieldCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No pending verification requests.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Platform Properties</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search properties..." 
                  className="pl-8" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-slate-500 text-sm">
                      <th className="pb-4 font-medium">Property</th>
                      <th className="pb-4 font-medium">Location</th>
                      <th className="pb-4 font-medium">Price</th>
                      <th className="pb-4 font-medium">Owner ID</th>
                      <th className="pb-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {properties.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.location.toLowerCase().includes(searchQuery.toLowerCase())).map(prop => (
                      <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={prop.images[0] || 'https://picsum.photos/seed/house/100/100'} 
                              alt="" 
                              className="h-10 w-10 rounded object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="font-bold text-slate-900">{prop.title}</div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-slate-600">{prop.location}</td>
                        <td className="py-4 font-medium">KSh {prop.price.toLocaleString()}</td>
                        <td className="py-4 text-xs text-slate-500 font-mono">{prop.ownerId}</td>
                        <td className="py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteProperty(prop.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
