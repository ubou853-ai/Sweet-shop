import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, ShoppingBag, Settings, LogOut, Edit2, Plus, Trash2, Check, X, Camera, Bell, Lock, Loader2, Heart } from 'lucide-react';
import { auth, db, doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, query, where, updatePassword, updateProfile } from '../firebase';
import { cn } from '../lib/utils';
import { ALL_PRODUCTS } from '../App';

export const ProfileDashboard = ({ user, onLogout, wishlist, onToggleWishlist }: { user: { id: string; name: string; email: string } | null, onLogout: () => void, wishlist: number[], onToggleWishlist: (product: any) => void }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Address Edit State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', zip: '', isDefault: false });

  // Settings State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchAddresses();
      fetchOrders();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setEditName(data.name || '');
        setEditPhone(data.phone || '');
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, `users/${user.id}/addresses`));
      const querySnapshot = await getDocs(q);
      const fetchedAddresses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAddresses(fetchedAddresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', user.id));
      const querySnapshot = await getDocs(q);
      const fetchedOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date descending
      fetchedOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.id);
      await updateDoc(docRef, {
        name: editName,
        phone: editPhone
      });
      setUserData({ ...userData, name: editName, phone: editPhone });
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingAddressId) {
        // Update existing
        await updateDoc(doc(db, `users/${user.id}/addresses`, editingAddressId), {
          ...newAddress
        });
        
        // If setting as default, update others
        if (newAddress.isDefault) {
          for (const addr of addresses) {
            if (addr.isDefault && addr.id !== editingAddressId) {
              await updateDoc(doc(db, `users/${user.id}/addresses`, addr.id), { isDefault: false });
            }
          }
        }
        
        setAddresses(addresses.map(a => a.id === editingAddressId ? { ...a, ...newAddress } : a));
        setEditingAddressId(null);
      } else {
        // Add new
        const docRef = await addDoc(collection(db, `users/${user.id}/addresses`), {
          ...newAddress,
          createdAt: new Date().toISOString()
        });
        
        // If setting as default, update others
        if (newAddress.isDefault) {
          for (const addr of addresses) {
            if (addr.isDefault) {
              await updateDoc(doc(db, `users/${user.id}/addresses`, addr.id), { isDefault: false });
            }
          }
        }
        
        setAddresses([...addresses, { id: docRef.id, ...newAddress, createdAt: new Date().toISOString() }]);
      }
      
      setIsAddingAddress(false);
      setNewAddress({ street: '', city: '', state: '', zip: '', isDefault: false });
      if (newAddress.isDefault) fetchAddresses(); // Refresh to update other defaults
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  const startEditAddress = (addr: any) => {
    setNewAddress({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      isDefault: addr.isDefault
    });
    setEditingAddressId(addr.id);
    setIsAddingAddress(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.id}/addresses`, id));
      setAddresses(addresses.filter(a => a.id !== id));
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!user) return;
    try {
      // Update all to false
      for (const addr of addresses) {
        if (addr.isDefault) {
          await updateDoc(doc(db, `users/${user.id}/addresses`, addr.id), { isDefault: false });
        }
      }
      // Update selected to true
      await updateDoc(doc(db, `users/${user.id}/addresses`, id), { isDefault: true });
      fetchAddresses(); // Refresh
    } catch (error) {
      console.error("Error setting default address:", error);
    }
  };

  const handleToggleNotifications = async () => {
    if (!user || !userData) return;
    try {
      const newValue = !userData.notificationsEnabled;
      await updateDoc(doc(db, 'users', user.id), { notificationsEnabled: newValue });
      setUserData({ ...userData, notificationsEnabled: newValue });
    } catch (error) {
      console.error("Error toggling notifications:", error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setPasswordSuccess("Password updated successfully");
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError("User not authenticated");
      }
    } catch (error: any) {
      setPasswordError(error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    
    const file = e.target.files[0];
    if (file.size > 1024 * 1024) {
      alert("File is too large. Maximum size is 1MB.");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoURL = reader.result as string;
        
        try {
          // Update Auth Profile
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL });
          }
          
          // Update Firestore
          await updateDoc(doc(db, 'users', user.id), { photoURL });
          
          setUserData({ ...userData, photoURL });
        } catch (err) {
          console.error("Error updating profile with photo:", err);
          alert("Failed to update profile picture.");
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
      setIsUploadingPhoto(false);
    }
  };

  if (!user) {
    return (
      <div className="pt-32 pb-20 bg-[#FAFAFA] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-3xl text-teal-primary font-bold mb-4">Please Login</h2>
          <p className="text-gray-500">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pt-32 pb-20 bg-[#FAFAFA] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-primary" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="pt-32 pb-20 bg-[#FAFAFA] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                    {userData?.photoURL ? (
                      <img src={userData.photoURL} alt={userData.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={40} className="text-teal-primary/50" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-teal-primary transition-colors cursor-pointer">
                    {isUploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                  </label>
                </div>
                <h3 className="font-serif font-bold text-xl text-gray-900">{userData?.name || user.name}</h3>
                <p className="text-sm text-gray-500">{userData?.email || user.email}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <nav className="flex flex-col">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors border-l-2",
                        activeTab === tab.id
                          ? "border-teal-primary text-teal-primary bg-teal-50/50"
                          : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-3 px-6 py-4 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-l-2 border-transparent"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-serif font-bold text-gray-900">Personal Information</h2>
                    {!isEditingProfile && (
                      <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 text-sm font-medium text-teal-primary hover:text-teal-700 transition-colors">
                        <Edit2 size={16} /> Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium px-4 py-2 bg-gray-50 rounded-xl border border-transparent">{userData?.name || 'Not provided'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                      <p className="text-gray-500 font-medium px-4 py-2 bg-gray-50 rounded-xl border border-transparent cursor-not-allowed">{userData?.email}</p>
                      <p className="text-xs text-gray-400 mt-1 ml-2">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                      {isEditingProfile ? (
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-transparent"
                          placeholder="+91 9876543210"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium px-4 py-2 bg-gray-50 rounded-xl border border-transparent">{userData?.phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <button onClick={handleSaveProfile} className="px-6 py-2 bg-teal-primary text-white rounded-xl font-medium hover:bg-teal-700 transition-colors">
                        Save Changes
                      </button>
                      <button onClick={() => { setIsEditingProfile(false); setEditName(userData?.name || ''); setEditPhone(userData?.phone || ''); }} className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-serif font-bold text-gray-900">Delivery Addresses</h2>
                    {!isAddingAddress && (
                      <button onClick={() => setIsAddingAddress(true)} className="flex items-center gap-2 text-sm font-medium text-teal-primary hover:text-teal-700 transition-colors">
                        <Plus size={16} /> Add New
                      </button>
                    )}
                  </div>

                  {isAddingAddress && (
                    <form onSubmit={handleAddAddress} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
                      <h3 className="font-medium text-gray-900 mb-4">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                        <input required type="text" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-transparent" placeholder="123 Main St, Apt 4B" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <input required type="text" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-transparent" placeholder="New Delhi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          <input required type="text" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-transparent" placeholder="Delhi" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PIN / ZIP Code</label>
                        <input required type="text" value={newAddress.zip} onChange={e => setNewAddress({...newAddress, zip: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-transparent" placeholder="110001" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" id="isDefault" checked={newAddress.isDefault} onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})} className="rounded text-teal-primary focus:ring-teal-primary" />
                        <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default address</label>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button type="submit" className="px-6 py-2 bg-teal-primary text-white rounded-xl font-medium hover:bg-teal-700 transition-colors">Save Address</button>
                        <button type="button" onClick={() => { setIsAddingAddress(false); setEditingAddressId(null); setNewAddress({ street: '', city: '', state: '', zip: '', isDefault: false }); }} className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.length === 0 && !isAddingAddress ? (
                      <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>No addresses saved yet.</p>
                      </div>
                    ) : (
                      addresses.map(addr => (
                        <div key={addr.id} className={cn("p-5 rounded-2xl border relative", addr.isDefault ? "border-teal-primary bg-teal-50/30" : "border-gray-200 bg-white")}>
                          {addr.isDefault && (
                            <span className="absolute top-4 right-4 text-xs font-bold bg-teal-100 text-teal-800 px-2 py-1 rounded-md">DEFAULT</span>
                          )}
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-900 font-medium mb-1">{addr.street}</p>
                              <p className="text-gray-500 text-sm">{addr.city}, {addr.state} {addr.zip}</p>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            {!addr.isDefault ? (
                              <button onClick={() => handleSetDefaultAddress(addr.id)} className="text-sm font-medium text-teal-primary hover:text-teal-700">Set as Default</button>
                            ) : <div></div>}
                            <div className="flex items-center gap-4">
                              <button onClick={() => startEditAddress(addr)} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
                                <Edit2 size={14} /> Edit
                              </button>
                              <button onClick={() => handleDeleteAddress(addr.id)} className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1">
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-serif font-bold text-gray-900">Order History</h2>
                  </div>

                  {orders.length === 0 ? (
                    <div className="py-16 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-900 mb-1">No orders yet</p>
                      <p>When you place an order, it will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-gray-100 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-sm font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                order.status === 'Delivered' ? "bg-green-100 text-green-800" :
                                order.status === 'Preparing' ? "bg-blue-100 text-blue-800" :
                                "bg-yellow-100 text-yellow-800"
                              )}>
                                {order.status}
                              </span>
                              <p className="font-serif font-bold text-lg text-gray-900">₹{order.totalAmount}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700"><span className="text-gray-400 mr-2">{item.quantity}x</span> {item.name}</span>
                                <span className="text-gray-900 font-medium">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Wishlist Tab */}
              {activeTab === 'wishlist' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-serif font-bold text-gray-900">My Wishlist</h2>
                  </div>

                  {wishlist.length === 0 ? (
                    <div className="py-16 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-900 mb-1">Your wishlist is empty</p>
                      <p>Save items you love to your wishlist.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {ALL_PRODUCTS.filter(p => wishlist.includes(p.id)).map(product => (
                        <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 relative">
                          <div className="aspect-square bg-pink-pastel/20 p-4 relative">
                            <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                            <button 
                              onClick={() => onToggleWishlist(product)}
                              className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-terracotta hover:bg-white transition-all z-10"
                            >
                              <Heart size={18} className="fill-terracotta" />
                            </button>
                          </div>
                          <div className="p-4">
                            <h3 className="font-serif font-bold text-lg text-teal-primary mb-1 truncate">{product.name}</h3>
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-sans font-semibold text-gray-900">₹{product.price}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-serif font-bold text-gray-900">Account Settings</h2>
                  </div>

                  {/* Notifications */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-primary">
                          <Bell size={20} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Email Notifications</h3>
                          <p className="text-sm text-gray-500">Receive updates about your orders and promotions</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleToggleNotifications}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-primary focus:ring-offset-2",
                          userData?.notificationsEnabled ? "bg-teal-primary" : "bg-gray-200"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          userData?.notificationsEnabled ? "translate-x-6" : "translate-x-1"
                        )} />
                      </button>
                    </div>
                  </div>

                  {/* Change Password */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-primary">
                        <Lock size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Change Password</h3>
                        <p className="text-sm text-gray-500">Update your account password</p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      {passwordError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{passwordError}</div>}
                      {passwordSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm">{passwordSuccess}</div>}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input 
                          type="password" 
                          required 
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input 
                          type="password" 
                          required 
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-transparent" 
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isUpdatingPassword}
                        className="px-6 py-2 bg-teal-primary text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-70 flex items-center gap-2"
                      >
                        {isUpdatingPassword && <Loader2 size={16} className="animate-spin" />}
                        Update Password
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
