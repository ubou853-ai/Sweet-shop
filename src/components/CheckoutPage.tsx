import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, CheckCircle, Loader2, Plus, ArrowLeft, Check } from 'lucide-react';
import { auth, db, collection, addDoc, getDocs, onSnapshot, doc, getDoc } from '../firebase';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import emailjs from '@emailjs/browser';

export const CheckoutPage = ({ cartItems, setCartItems, setCurrentPage, user }: any) => {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    if (!user) {
      setCurrentPage('cart');
      return;
    }

    const unsubscribe = onSnapshot(collection(db, `users/${user.id}/addresses`), (snapshot) => {
      const addrList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAddresses(addrList);
      
      // Auto-select default address if exists
      const defaultAddr = addrList.find((a: any) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (addrList.length > 0 && !selectedAddressId) {
        setSelectedAddressId(addrList[0].id);
      }
      
      setIsLoadingAddresses(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      
      const orderData = {
        userId: user.id,
        userName: user.name,
        items: cartItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: total,
        status: 'Pending',
        shippingAddress: selectedAddress,
        paymentMethod,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      // --- Send FCM Notification from Frontend ---
      try {
        const adminDoc = await getDoc(doc(db, 'admin', 'device'));
        if (adminDoc.exists()) {
          const adminToken = adminDoc.data().token;
          const serverKey = import.meta.env.VITE_FCM_SERVER_KEY;
          
          if (adminToken && serverKey) {
            const itemCount = cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
            
            // Using Netlify proxy to bypass CORS
            await fetch('/api/fcm/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${serverKey}`
              },
              body: JSON.stringify({
                to: adminToken,
                notification: {
                  title: 'New Order Received 🍬',
                  body: `${user.name} placed an order for ₹${total} (${itemCount} items)`
                }
              })
            });
            console.log('Admin notification sent successfully');
          } else {
            console.log('Missing admin token or VITE_FCM_SERVER_KEY');
          }
        }
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
      }
      // --- END Notification Logic ---
      
      // --- Send Email via EmailJS ---
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const phone = userData.phone || 'Not provided';
        
        const addressStr = `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zip}`;
        const itemsStr = cartItems.map((item: any) => `${item.name} (x${item.quantity})`).join(', ');

        const templateParams = {
          name: user.name,
          phone: phone,
          address: addressStr,
          items: itemsStr,
          price: `₹${total}`
        };

        await emailjs.send(
          'service_oovd3h8',
          'template_0068kk3',
          templateParams,
          'vWvNXOM-LxetcpV0n'
        );
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
      // --- END Email Logic ---
      
      // Clear cart
      setCartItems([]);
      
      // Show success and redirect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setIsOrderPlaced(true);
      
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isOrderPlaced) {
    return (
      <div className="pt-32 pb-20 bg-[#FAFAFA] min-h-screen flex flex-col items-center justify-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center max-w-lg w-full">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <Check size={48} />
          </div>
          <h2 className="font-serif text-3xl text-teal-primary font-bold mb-4">Order placed successfully</h2>
          <p className="text-gray-500 mb-8">Thank you for your order! You will receive a notification shortly.</p>
          <button 
            onClick={() => setCurrentPage('menu')}
            className="bg-teal-primary hover:bg-teal-light text-white font-bold py-3 px-8 rounded-full transition-colors shadow-md"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="pt-32 pb-20 bg-[#FAFAFA] min-h-screen flex flex-col items-center justify-center">
        <h2 className="font-serif text-3xl text-teal-primary font-bold mb-4">Your Cart is Empty</h2>
        <button onClick={() => setCurrentPage('menu')} className="bg-teal-primary text-white py-3 px-8 rounded-full">Go to Menu</button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => setCurrentPage('cart')}
          className="flex items-center text-gray-500 hover:text-teal-primary mb-8 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" /> Back to Cart
        </button>
        
        <h1 className="font-serif text-4xl text-teal-primary font-bold mb-12">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Delivery Address Section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="font-serif text-2xl text-teal-primary font-bold mb-6 flex items-center">
                <MapPin className="mr-3" /> Delivery Address
              </h2>
              
              {isLoadingAddresses ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-primary" /></div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 mb-4">You don't have any saved addresses.</p>
                  <button 
                    onClick={() => setCurrentPage('profile')}
                    className="text-teal-primary font-medium flex items-center justify-center mx-auto hover:text-teal-700"
                  >
                    <Plus size={18} className="mr-1" /> Add Address in Profile
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div 
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={cn(
                        "p-4 rounded-2xl border-2 cursor-pointer transition-all",
                        selectedAddressId === addr.id 
                          ? "border-teal-primary bg-teal-50/50" 
                          : "border-gray-100 hover:border-teal-primary/30"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900 flex items-center gap-2">
                          {addr.isDefault && <span className="bg-teal-primary text-white text-xs px-2 py-0.5 rounded-full">Default</span>}
                        </span>
                        {selectedAddressId === addr.id && <CheckCircle className="text-teal-primary" size={20} />}
                      </div>
                      <p className="text-gray-600 text-sm">{addr.street}</p>
                      <p className="text-gray-600 text-sm">{addr.city}, {addr.state} {addr.zip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="font-serif text-2xl text-teal-primary font-bold mb-6 flex items-center">
                <CreditCard className="mr-3" /> Payment Method
              </h2>
              
              <div className="space-y-4">
                <label className={cn(
                  "flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all",
                  paymentMethod === 'cod' ? "border-teal-primary bg-teal-50/50" : "border-gray-100 hover:border-teal-primary/30"
                )}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cod" 
                    checked={paymentMethod === 'cod'} 
                    onChange={() => setPaymentMethod('cod')}
                    className="w-5 h-5 text-teal-primary focus:ring-teal-primary border-gray-300"
                  />
                  <span className="ml-4 font-medium text-gray-900">Cash on Delivery</span>
                </label>
                
                <label className={cn(
                  "flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all",
                  paymentMethod === 'card' ? "border-teal-primary bg-teal-50/50" : "border-gray-100 hover:border-teal-primary/30"
                )}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="card" 
                    checked={paymentMethod === 'card'} 
                    onChange={() => setPaymentMethod('card')}
                    className="w-5 h-5 text-teal-primary focus:ring-teal-primary border-gray-300"
                  />
                  <div className="ml-4">
                    <span className="font-medium text-gray-900 block">Credit / Debit Card</span>
                    <span className="text-sm text-gray-500">Mock payment for demonstration</span>
                  </div>
                </label>
              </div>

              {paymentMethod === 'card' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-transparent" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input type="text" placeholder="MM/YY" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input type="text" placeholder="123" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-transparent" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-32">
              <h3 className="font-serif font-bold text-2xl text-teal-primary mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.quantity}x {item.name}</span>
                    <span className="font-medium text-gray-900">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-6 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-xl text-gray-900">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
              
              <button 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || !selectedAddressId}
                className="w-full bg-gold hover:bg-gold-light text-teal-primary font-bold py-4 rounded-xl transition-colors shadow-md uppercase tracking-wider disabled:opacity-70 flex justify-center items-center"
              >
                {isPlacingOrder ? <Loader2 className="animate-spin mr-2" /> : null}
                {isPlacingOrder ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
