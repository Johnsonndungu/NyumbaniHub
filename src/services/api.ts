const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },
  signup: async (userData: any) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Signup failed');
    }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Users
  getUser: async (id: string) => {
    const res = await fetch(`${API_BASE}/users/${id}`, { headers: getHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'User not found');
    }
    return res.json();
  },
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch users');
    }
    return res.json();
  },
  syncUser: async (userData: any) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to sync user');
    }
    return res.json();
  },
  updateUser: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update user');
    }
    return res.json();
  },
  deleteUser: async (id: string) => {
    const res = await fetch(`${API_BASE}/users/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete user');
    }
    return res.json();
  },

  // Properties
  getProperties: async (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/properties?${params}`, { headers: getHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch properties');
    }
    return res.json();
  },
  createProperty: async (data: any) => {
    const res = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id: crypto.randomUUID(), ...data })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create property');
    }
    return res.json();
  },
  updateProperty: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/properties/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update property');
    }
    return res.json();
  },
  deleteProperty: async (id: string) => {
    const res = await fetch(`${API_BASE}/properties/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete property');
    }
    return res.json();
  },

  // Applications
  getApplications: async (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/applications?${params}`, { headers: getHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch applications');
    }
    return res.json();
  },
  createApplication: async (data: any) => {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id: crypto.randomUUID(), ...data })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create application');
    }
    return res.json();
  },
  updateApplication: async (id: string, status: string) => {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update application');
    }
    return res.json();
  },

  // Messages
  getMessages: async (userId: string) => {
    const res = await fetch(`${API_BASE}/messages?userId=${userId}`, { headers: getHeaders() });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch messages');
    }
    return res.json();
  },
  sendMessage: async (data: any) => {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id: crypto.randomUUID(), ...data })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to send message');
    }
    return res.json();
  },

  // Broadcasts
  sendBroadcast: async (data: any) => {
    const res = await fetch(`${API_BASE}/broadcasts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id: crypto.randomUUID(), ...data })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to send broadcast');
    }
    return res.json();
  }
};
