import React, { useState, useEffect } from 'react';
import { Property, Application } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  MessageSquare, 
  Settings, 
  Plus, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  CreditCard,
  AlertTriangle,
  Send,
  User as UserIcon,
  File as FileIcon,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Chat } from './Chat';
import { NewListingForm } from './NewListingForm';
import { api } from '@/src/services/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AgentDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'listings' | 'messages' | 'tenants' | 'settings' | 'payments'>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState({
    displayName: '',
    phoneNumber: '',
    country: '',
    photoURL: '',
    documentURL: '',
    documentType: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      setProfileData({
        displayName: currentUser.displayName || '',
        phoneNumber: currentUser.phoneNumber || '',
        country: currentUser.country || '',
        photoURL: currentUser.photoURL || '',
        documentURL: currentUser.documentURL || '',
        documentType: currentUser.documentType || ''
      });
      fetchDashboardData(currentUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updatedUser = await api.updateUser(user.id, profileData);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await api.uploadFile(file);
      setProfileData(prev => ({ ...prev, documentURL: url }));
      toast.success('Document uploaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch properties listed by this agent
      const propsData = await api.getProperties({ ownerId: userId });
      const safeProps = Array.isArray(propsData) ? propsData : [];
      setProperties(safeProps);

      // Fetch applications for these properties
      const allApps = await api.getApplications();
      const safeApps = Array.isArray(allApps) ? allApps : [];
      
      // Filter applications for properties owned by this user
      const propIds = safeProps.map((p: any) => p.id);
      const filteredApps = safeApps.filter((app: any) => propIds.includes(app.propertyId));
      setApplications(filteredApps);

      // Fetch payments
      const paysData = await api.getPayments({ userId });
      setPayments(Array.isArray(paysData) ? paysData : []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.updateApplication(id, newStatus);
      
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status: newStatus } : app
      ));
      toast.success(`Application ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleNewListingSuccess = () => {
    setIsDialogOpen(false);
    setEditingProperty(null);
    if (user) fetchDashboardData(user.id);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await api.deleteProperty(id);
      setProperties(prev => prev.filter(p => p.id !== id));
      toast.success('Property deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete property');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AnimatePresence>
        {user && !user.emailVerified && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500 text-white overflow-hidden fixed top-0 left-0 right-0 z-[60]"
          >
            <div className="container mx-auto px-4 py-2 flex items-center justify-between text-sm font-medium">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Please verify your email with the 6-digit code we sent you.</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20 h-7 text-xs gap-1"
                onClick={async () => {
                  try {
                    await api.resendVerification(user.email);
                    toast.success('Verification code sent!');
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              >
                <Send className="h-3 w-3" /> Resend Code
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r hidden md:block ${user && !user.emailVerified ? 'mt-9' : ''}`}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-primary">Agent Portal</h2>
        </div>
        <nav className="px-4 space-y-1">
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full justify-start gap-3 ${activeTab === 'dashboard' ? 'bg-primary/5 text-primary' : ''}`}
          >
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('listings')}
            className={`w-full justify-start gap-3 ${activeTab === 'listings' ? 'bg-primary/5 text-primary' : ''}`}
          >
            <Home className="h-4 w-4" /> My Listings
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('tenants')}
            className={`w-full justify-start gap-3 ${activeTab === 'tenants' ? 'bg-primary/5 text-primary' : ''}`}
          >
            <Users className="h-4 w-4" /> Tenants
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('payments')}
            className={`w-full justify-start gap-3 ${activeTab === 'payments' ? 'bg-primary/5 text-primary' : ''}`}
          >
            <CreditCard className="h-4 w-4" /> Payments
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('messages')}
            className={`w-full justify-start gap-3 ${activeTab === 'messages' ? 'bg-primary/5 text-primary' : ''}`}
          >
            <MessageSquare className="h-4 w-4" /> Messages
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('settings')}
            className={`w-full justify-start gap-3 ${activeTab === 'settings' ? 'bg-primary/5 text-primary' : ''}`}
          >
            <Settings className="h-4 w-4" /> Settings
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (open && !user?.isVerified) {
            toast.error("Account verification required. Please wait for an admin to verify your account.");
            return;
          }
          setIsDialogOpen(open);
          if (!open) setEditingProperty(null);
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProperty ? 'Edit Property Listing' : 'Add New Property Listing'}</DialogTitle>
              <DialogDescription>
                {editingProperty ? 'Update the details of your property listing.' : 'Fill in the details below to list a new property on Nyumbani Hub.'}
              </DialogDescription>
            </DialogHeader>
            <NewListingForm 
              property={editingProperty || undefined}
              onSuccess={handleNewListingSuccess} 
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingProperty(null);
              }} 
            />
          </DialogContent>
        </Dialog>

        {activeTab === 'dashboard' && (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.displayName || 'Partner'}</h1>
                <p className="text-slate-500">Here's what's happening with your properties today.</p>
                {user && !user.isVerified && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-sm max-w-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold mb-0.5">Verification Pending</p>
                      <p className="opacity-80">Your account is currently under review. Please ensure you have uploaded your verification documents in the <button onClick={() => setActiveTab('settings')} className="font-bold underline">Settings</button> tab. Some features may be limited until verified.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                className="gap-2" 
                onClick={() => {
                  setEditingProperty(null);
                  setIsDialogOpen(true);
                }}
                disabled={user && !user.isVerified}
              >
                <Plus className="h-4 w-4" /> Add New Listing
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Active Listings</p>
                      <h3 className="text-2xl font-bold">{properties.length}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                      <Home className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">New Applications</p>
                      <h3 className="text-2xl font-bold">{applications.filter(a => a.status === 'pending').length}</h3>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Monthly Revenue</p>
                      <h3 className="text-2xl font-bold">KSh {properties.reduce((acc, p) => acc + p.price, 0).toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Applications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Applications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {applications.length > 0 ? applications.map((app) => (
                        <div key={app.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900">{app.tenantName}</div>
                            <div className="text-xs text-slate-500">{app.propertyTitle}</div>
                            <div className="text-sm text-slate-600 mt-2 italic">"{app.message}"</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={app.status === 'approved' ? 'default' : app.status === 'pending' ? 'secondary' : 'destructive'}>
                              {app.status}
                            </Badge>
                            {app.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button size="xs" variant="outline" className="h-7 w-7 p-0 text-emerald-600" onClick={() => handleStatusUpdate(app.id, 'approved')}>
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button size="xs" variant="outline" className="h-7 w-7 p-0 text-destructive" onClick={() => handleStatusUpdate(app.id, 'rejected')}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )) : (
                        <p className="text-center text-slate-500 py-4">No applications yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* My Listings Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>My Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {properties.length > 0 ? properties.map((prop) => (
                        <div key={prop.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <img src={prop.images[0]} className="h-12 w-12 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900 truncate">{prop.title}</div>
                            <div className="text-xs text-slate-500">{prop.location}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary text-sm">KSh {prop.price.toLocaleString()}</div>
                            <Badge variant="outline" className="text-[10px] h-4">Available</Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(prop)}>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )) : (
                        <p className="text-center text-slate-500 py-4">You haven't listed any properties yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
              <p className="text-slate-500">Chat with potential tenants and clients.</p>
            </div>
            <Chat />
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Payments Received</h1>
                <p className="text-slate-500">Track all rent and deposit payments from your tenants.</p>
              </div>
              <Badge variant="outline" className="text-lg py-1 px-4">{payments.length} Transactions</Badge>
            </div>
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-4 font-bold text-sm">Tenant</th>
                    <th className="p-4 font-bold text-sm">Property</th>
                    <th className="p-4 font-bold text-sm">Amount</th>
                    <th className="p-4 font-bold text-sm">Purpose</th>
                    <th className="p-4 font-bold text-sm">Status</th>
                    <th className="p-4 font-bold text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pay) => (
                    <tr key={pay.id} className="border-b last:border-0">
                      <td className="p-4 text-sm font-medium">{pay.tenantName}</td>
                      <td className="p-4 text-sm">{pay.propertyTitle}</td>
                      <td className="p-4 text-sm font-bold">KSh {pay.amount.toLocaleString()}</td>
                      <td className="p-4 text-sm capitalize">{pay.purpose}</td>
                      <td className="p-4 text-sm">
                        <Badge className={pay.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                          {pay.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {new Date(pay.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No payments received yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
                <p className="text-slate-500">Manage all your properties in one place.</p>
              </div>
              <Button 
                onClick={() => {
                  if (!user?.isVerified) {
                    toast.error("Account verification required. Please wait for an admin to verify your account.");
                    return;
                  }
                  setEditingProperty(null);
                  setIsDialogOpen(true);
                }} 
                className="gap-2"
                disabled={user && !user.isVerified}
              >
                <Plus className="h-4 w-4" /> Add New Listing
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(prop => (
                <div key={prop.id} className="bg-white rounded-2xl border overflow-hidden group">
                   <div className="relative h-48 overflow-hidden">
                      <img src={prop.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-white/90 text-primary hover:bg-white">Available</Badge>
                      </div>
                   </div>
                   <div className="p-4">
                      <h3 className="font-bold text-slate-900 mb-1">{prop.title}</h3>
                      <p className="text-xs text-slate-500 mb-4">{prop.location}</p>
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-primary">KSh {prop.price.toLocaleString()}</div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(prop)}>Edit</Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(prop.id)}>Delete</Button>
                        </div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
              <p className="text-slate-500">Manage your current tenants and their lease details.</p>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="p-4 font-bold text-sm text-slate-700">Tenant Name</th>
                        <th className="p-4 font-bold text-sm text-slate-700">Property</th>
                        <th className="p-4 font-bold text-sm text-slate-700">Rent Status</th>
                        <th className="p-4 font-bold text-sm text-slate-700">Lease Ends</th>
                        <th className="p-4 font-bold text-sm text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.filter(a => a.status === 'approved').map(tenant => (
                        <tr key={tenant.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-slate-900">{tenant.tenantName}</div>
                            <div className="text-xs text-slate-500">{tenant.tenantEmail}</div>
                          </td>
                          <td className="p-4 text-sm text-slate-600">{tenant.propertyTitle}</td>
                          <td className="p-4">
                            <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Paid</Badge>
                          </td>
                          <td className="p-4 text-sm text-slate-600">Dec 31, 2026</td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm">View Details</Button>
                          </td>
                        </tr>
                      ))}
                      {applications.filter(a => a.status === 'approved').length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">No active tenants found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-500">Manage your account and agency profile.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Agency Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-900">Verification Documents</h4>
                        <p className="text-xs text-slate-500">
                          {user?.role === 'agent' 
                            ? 'Upload Government Certificate of Registration' 
                            : 'Upload ID, Passport or Driving License'}
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border">
                        <FileIcon className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Document Type</label>
                      <select 
                        className="w-full p-2 text-sm border rounded-lg bg-white"
                        value={profileData.documentType}
                        onChange={(e) => setProfileData({ ...profileData, documentType: e.target.value })}
                      >
                        <option value="">Select document type...</option>
                        {user?.role === 'agent' ? (
                          <option value="registration_cert">Certificate of Registration</option>
                        ) : (
                          <>
                            <option value="national_id">National ID Card</option>
                            <option value="passport">Passport</option>
                            <option value="driving_license">Driving License</option>
                          </>
                        )}
                        <option value="other">Other Supporting Document</option>
                      </select>
                    </div>
                    
                    {profileData.documentURL ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="flex-1 truncate">Document uploaded</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => setProfileData(p => ({ ...p, documentURL: '' }))}
                          >Change</Button>
                        </div>
                        <a 
                          href={profileData.documentURL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors p-2 border rounded-lg bg-white"
                        >
                          <FileIcon className="h-4 w-4" /> View My Uploaded Document
                        </a>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          accept=".pdf,image/*"
                        />
                        <Button variant="outline" className="w-full gap-2" disabled={uploading}>
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" /> Choose File
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 pb-4 border-b">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profileData.photoURL} />
                      <AvatarFallback>{profileData.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Profile Picture URL</label>
                      <input 
                        className="w-full p-2 text-sm border rounded-lg" 
                        placeholder="https://example.com/photo.jpg"
                        value={profileData.photoURL}
                        onChange={(e) => setProfileData({ ...profileData, photoURL: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Agency Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 rounded-lg border" 
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <input type="email" className="w-full p-2 rounded-lg border" defaultValue={user?.email || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone Number</label>
                    <input 
                      type="tel" 
                      className="w-full p-2 rounded-lg border" 
                      value={profileData.phoneNumber}
                      onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Country</label>
                    <input 
                      type="text" 
                      className="w-full p-2 rounded-lg border" 
                      placeholder="Kenya"
                      value={profileData.country}
                      onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    />
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-xs text-slate-500">Receive emails for new applications</div>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <div className="font-medium">SMS Alerts</div>
                      <div className="text-xs text-slate-500">Get text messages for urgent messages</div>
                    </div>
                    <input type="checkbox" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

