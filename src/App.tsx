import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, MapPin, Phone, MessageCircle, Plus, ChevronRight, Star, Heart, ArrowRight, User, LogOut, Search } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { AuthModal } from './components/AuthModal';
import { ProfileDashboard } from './components/ProfileDashboard';
import { CheckoutPage } from './components/CheckoutPage';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { auth, onAuthStateChanged, signOut, db, collection, addDoc, doc, setDoc, deleteDoc, onSnapshot, messaging, getToken, onMessage } from './firebase';

// --- Global Data ---
export const ALL_PRODUCTS = [
  { id: 1, name: 'Rajauli Special Chhena', price: 450, desc: 'Soft, spongy chhena soaked in light sugar syrup. A local legend.', category: 'Daily Delights', isBestseller: true, image: 'https://i.ibb.co/Hk85VVT/1774262412832.png', hoverImage: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop&q=60' },
  { id: 2, name: 'Assorted Mithai Box (Mixed Premium)', price: 850, desc: 'A curated selection of our finest sweets in a beautiful gift box.', category: 'Signature Boxes', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60' },
  { id: 3, name: 'Kaju Katli (Premium Silver Varq)', price: 900, desc: 'Premium cashew fudge with edible silver foil.', category: 'Signature Boxes', image: 'https://i.ibb.co/CKT3PmyH/Kaju-Katli-Sweets.png' },
  { id: 4, name: 'Spicy Mixture', price: 250, desc: 'Crunchy, spicy namkeen perfect for tea time.', category: 'Savory Snacks', image: 'https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?w=500&auto=format&fit=crop&q=60' },
  { id: 5, name: 'Motichoor Laddu (Premium Small Size)', price: 400, desc: 'Tiny gram flour pearls fried in ghee and shaped into sweet balls.', category: 'Signature Boxes', image: 'https://i.ibb.co/pjFrCjxF/file-00000000ec78720b98fbf829d1910e99.png' },
  { id: 6, name: 'Festive Hamper', price: 1500, desc: 'The ultimate collection of sweets and savories for celebrations.', category: 'Festive Specials', isBestseller: true, image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=500&auto=format&fit=crop&q=60' },
  { id: 7, name: 'Classic Rasgulla', price: 350, desc: 'Soft and spongy milk-solid balls soaked in rose-scented sugar syrup.', category: 'Daily Delights', image: 'https://i.ibb.co/H6p8cbW/durga-puja-bhog-indian-sweet-rassogulla-indian-sweet-rassgulla-made-sugar-syrup-cottage-cheese-chenn.jpg' },
  { id: 8, name: 'Special Laddu', price: 400, desc: 'Traditional sweet balls made with roasted flour, ghee, and premium nuts.', category: 'Daily Delights', image: 'https://i.ibb.co/bMr5QK2c/1774262621098.png' },
  { id: 9, name: 'Classic Barfi', price: 600, desc: 'Rich, melt-in-your-mouth milk fudge garnished with pistachios and silver leaf.', category: 'Daily Delights', image: 'https://i.ibb.co/d0YL6DFL/1774262666712.png' },
  { id: 10, name: 'Dry Fruit Laddu (Anjeer + Badam)', price: 750, desc: 'Healthy and delicious laddu made with figs, almonds, and pure ghee.', category: 'Signature Boxes', image: 'https://i.ibb.co/F4Hkmmjr/1774627909708.png' },
  { id: 11, name: 'Pista Roll', price: 1100, desc: 'Premium pistachio rolls wrapped in cashew dough and silver leaf.', category: 'Signature Boxes', image: 'https://i.ibb.co/b5T2BXtN/file-000000005a8c720bb8cbfbf59ac5ef32.png' },
  { id: 12, name: 'Chocolate Burfi', price: 650, desc: 'A fusion delight combining rich chocolate with traditional milk fudge.', category: 'Signature Boxes', image: 'https://i.ibb.co/v64wLmKY/1774627715036.png' },
  { id: 13, name: 'Anjeer Barfi', price: 800, desc: 'Nutritious and naturally sweet fig fudge loaded with crunchy nuts.', category: 'Signature Boxes', image: 'https://i.ibb.co/0VfFKqj6/file-00000000dc10720b8cb5e249cfc2d7a5.png' },
  { id: 14, name: 'Kesar Peda Box', price: 550, desc: 'Saffron-infused milk sweets, a classic offering for every occasion.', category: 'Signature Boxes', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&auto=format&fit=crop&q=60' },
  { id: 15, name: 'Rose Laddu (Gulkand Style)', price: 600, desc: 'Fragrant rose-flavored laddus stuffed with sweet gulkand.', category: 'Signature Boxes', image: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=500&auto=format&fit=crop&q=60' },
  { id: 16, name: 'Special Dry Fruit Halwa', price: 700, desc: 'Rich, chewy halwa packed with premium dry fruits and desi ghee.', category: 'Signature Boxes', image: 'https://i.ibb.co/q3G8Dh1H/1774627633957.png' },
  { id: 17, name: 'Gulab Jamun', price: 300, desc: 'Deep-fried milk solid balls soaked in cardamom-flavored sugar syrup.', category: 'Daily Delights', image: 'https://i.ibb.co/Mjb8DLx/vecteezy-lyangcha-langcha-or-lemcha-is-an-indian-sweet-dish-16282492.jpg' },
  { id: 18, name: 'Rasmalai', price: 500, desc: 'Soft paneer discs soaked in thickened, sweetened, and saffron-flavored milk.', category: 'Daily Delights', image: 'https://i.ibb.co/GvnJVFBt/Rasmalai-recipe-01.jpg' },
  { id: 19, name: 'Jalebi', price: 250, desc: 'Crispy, deep-fried spirals soaked in saffron sugar syrup.', category: 'Daily Delights', image: 'https://i.ibb.co/TMQnjZWM/Jalebi-recipe-1-1.jpg' },
  { id: 20, name: 'Mysore Pak', price: 700, desc: 'Rich and porous sweet made from generous amounts of ghee, sugar, and gram flour.', category: 'Signature Boxes', image: 'https://i.ibb.co/LDnjFCnw/file-00000000b228720ba02e5cd832a357ef.png' },
  { id: 21, name: 'Soan Papdi', price: 350, desc: 'Flaky, melt-in-your-mouth sweet made from gram flour, ghee, and almonds.', category: 'Daily Delights', image: 'https://i.ibb.co/twynJLfJ/soan-papdi.jpg' },
  { id: 22, name: 'Mathura Peda', price: 450, desc: 'Caramelized milk fudge flavored with cardamom.', category: 'Daily Delights', image: 'https://i.ibb.co/7xhFwnFD/1-1aa21282-d6a2-4896-9bbc-c1fda1b5d368-1800x1800.jpg' },
  { id: 23, name: 'Ghevar', price: 800, desc: 'Disc-shaped sweet made from flour and soaked in sugar syrup, topped with rabdi.', category: 'Festive Specials', image: 'https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?w=500&auto=format&fit=crop&q=60' },
  { id: 24, name: 'Kalakand', price: 550, desc: 'Soft and grainy milk cake made from solidified, sweetened milk and paneer.', category: 'Daily Delights', image: 'https://i.ibb.co/G3ddJ34W/Kalakand.jpg' },
  { id: 25, name: 'Cham Cham', price: 400, desc: 'Oval-shaped Bengali sweet made from paneer and cooked in sugar syrup.', category: 'Daily Delights', image: 'https://i.ibb.co/Cp8DPTNr/cham-cham.jpg' },
  { id: 26, name: 'Besan Ladoo', price: 350, desc: 'Roasted gram flour balls sweetened with sugar and enriched with ghee.', category: 'Daily Delights', image: 'https://i.ibb.co/MD2dxfQZ/Besan-Ladoo-Recipe-Festive-Sweet-4.webp' },
  { id: 27, name: 'Balushahi', price: 300, desc: 'Flaky, deep-fried dough discs soaked in sugar syrup.', category: 'Daily Delights', image: 'https://i.ibb.co/F4CHzmMb/product-jpeg-500x500.jpg' },
];

// --- Components ---

const CreatorBadge = () => (
  <div className="fixed top-0 right-0 z-[100] bg-black/70 backdrop-blur-md text-white text-[10px] sm:text-xs px-3 py-1.5 rounded-bl-xl shadow-lg border-b border-l border-white/10 flex items-center gap-1.5 transition-all hover:bg-black/90">
    <span className="opacity-90">Created by Anish Kumar</span>
    <span className="opacity-50">|</span>
    <span className="opacity-90">Instagram:</span>
    <a 
      href="https://instagram.com/anishraaz711" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="font-semibold text-saffron hover:underline tracking-wide"
    >
      @anishraaz711
    </a>
  </div>
);

const Ticker = () => {
  return (
    <div className="bg-terracotta text-white py-2 overflow-hidden whitespace-nowrap relative z-50">
      <motion.div
        className="inline-block"
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      >
        <span className="mx-4 font-medium tracking-wide text-sm">
          Delivering the authentic taste of Rajauli to your doorstep! | Pincode: 805125 | Call us: +91 7209275120
        </span>
        <span className="mx-4 font-medium tracking-wide text-sm">
          Delivering the authentic taste of Rajauli to your doorstep! | Pincode: 805125 | Call us: +91 7209275120
        </span>
        <span className="mx-4 font-medium tracking-wide text-sm">
          Delivering the authentic taste of Rajauli to your doorstep! | Pincode: 805125 | Call us: +91 7209275120
        </span>
      </motion.div>
    </div>
  );
};

const Navbar = ({ 
  setCurrentPage, 
  cartItemsCount, 
  user, 
  onLoginClick, 
  onLogoutClick,
  searchQuery,
  setSearchQuery,
  currentPage
}: { 
  setCurrentPage: (page: string) => void, 
  cartItemsCount: number,
  user: { id: string; name: string; email: string } | null,
  onLoginClick: () => void,
  onLogoutClick: () => void,
  searchQuery: string,
  setSearchQuery: (query: string) => void,
  currentPage: string
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 'menu' && e.target.value.trim() !== '') {
      setCurrentPage('menu');
    }
  };

  return (
    <nav className={cn(
      "fixed w-full z-40 transition-all duration-300",
      isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={isScrolled ? "text-teal-primary" : "text-white"}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-1 flex justify-center md:justify-start">
            <button onClick={() => setCurrentPage('home')} className={cn(
              "font-serif text-3xl font-bold tracking-tight",
              isScrolled ? "text-teal-primary" : "text-white"
            )}>
              Shaw Ji <span className="text-saffron text-xl align-top">âœ§</span>
            </button>
          </div>

          {/* Desktop Links - Top Right */}
          <div className="hidden md:flex items-center justify-end flex-1 space-x-6 lg:space-x-8">
            {/* Search Bar */}
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="flex items-center"
                >
                  <input
                    type="text"
                    placeholder="Search sweets..."
                    value={searchQuery}
                    onChange={handleSearch}
                    autoFocus
                    className={cn(
                      "w-full bg-transparent border-b outline-none px-2 py-1 text-sm transition-colors",
                      isScrolled ? "border-gray-300 text-gray-800 focus:border-teal-primary" : "border-white/50 text-white focus:border-white placeholder:text-white/70"
                    )}
                  />
                  <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className={cn("ml-2", isScrolled ? "text-gray-500" : "text-white")}>
                    <X size={16} />
                  </button>
                </motion.div>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className={cn(
                  "hover:text-saffron transition-colors",
                  isScrolled ? "text-gray-800" : "text-white"
                )}>
                  <Search size={20} />
                </button>
              )}
            </div>

            <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={cn(
              "text-sm font-semibold uppercase tracking-wider hover:text-saffron transition-colors",
              isScrolled ? "text-gray-800" : "text-white"
            )}>
              Home
            </button>
            <button onClick={() => setCurrentPage('menu')} className={cn(
              "text-sm font-semibold uppercase tracking-wider hover:text-saffron transition-colors",
              isScrolled ? "text-gray-800" : "text-white"
            )}>
              Menu
            </button>
            <button onClick={() => { setCurrentPage('home'); setTimeout(() => document.getElementById('visit-us')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className={cn(
              "text-sm font-semibold uppercase tracking-wider hover:text-saffron transition-colors",
              isScrolled ? "text-gray-800" : "text-white"
            )}>
              Contact Us
            </button>
            {user ? (
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentPage('profile')} className={cn(
                  "flex items-center gap-2 text-sm font-semibold uppercase tracking-wider hover:text-saffron transition-colors",
                  isScrolled ? "text-gray-800" : "text-white"
                )}>
                  <User size={20} />
                  <span>{user.name.split(' ')[0]}</span>
                </button>
                <button onClick={onLogoutClick} className={cn(
                  "flex items-center gap-2 text-sm font-semibold uppercase tracking-wider hover:text-red-500 transition-colors",
                  isScrolled ? "text-gray-800" : "text-white"
                )}>
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button onClick={onLoginClick} className={cn(
                "flex items-center gap-2 text-sm font-semibold uppercase tracking-wider hover:text-saffron transition-colors",
                isScrolled ? "text-gray-800" : "text-white"
              )}>
                <User size={20} />
                <span>Login</span>
              </button>
            )}
            <button onClick={() => setCurrentPage('cart')} className={cn(
              "relative flex items-center gap-2 text-sm font-semibold uppercase tracking-wider hover:text-saffron transition-colors",
              isScrolled ? "text-gray-800" : "text-white"
            )}>
              <ShoppingBag size={20} />
              <span>Cart</span>
              <AnimatePresence>
                {cartItemsCount > 0 && (
                  <motion.span 
                    key={cartItemsCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute -top-2 -right-3 bg-saffron text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white"
                  >
                    {cartItemsCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-lg"
          >
            <div className="px-4 pt-2 pb-6 space-y-1 flex flex-col">
              <button onClick={() => { setCurrentPage('home'); setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-left block px-3 py-4 text-base font-medium text-gray-800 border-b border-gray-50 uppercase tracking-wider">Home</button>
              <button onClick={() => { setCurrentPage('menu'); setIsMobileMenuOpen(false); }} className="text-left block px-3 py-4 text-base font-medium text-gray-800 border-b border-gray-50 uppercase tracking-wider">Menu</button>
              <button onClick={() => { setCurrentPage('home'); setIsMobileMenuOpen(false); setTimeout(() => document.getElementById('visit-us')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-left block px-3 py-4 text-base font-medium text-gray-800 border-b border-gray-50 uppercase tracking-wider">Contact Us</button>
              {user ? (
                <>
                  <button onClick={() => { setCurrentPage('profile'); setIsMobileMenuOpen(false); }} className="text-left block px-3 py-4 text-base font-medium text-gray-800 border-b border-gray-50 uppercase tracking-wider flex items-center gap-2">
                    <User size={20} /> Profile ({user.name.split(' ')[0]})
                  </button>
                  <button onClick={() => { onLogoutClick(); setIsMobileMenuOpen(false); }} className="text-left block px-3 py-4 text-base font-medium text-red-500 border-b border-gray-50 uppercase tracking-wider flex items-center gap-2">
                    <LogOut size={20} /> Logout
                  </button>
                </>
              ) : (
                <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="text-left block px-3 py-4 text-base font-medium text-gray-800 border-b border-gray-50 uppercase tracking-wider flex items-center gap-2">
                  <User size={20} /> Login
                </button>
              )}
              <button onClick={() => { setCurrentPage('cart'); setIsMobileMenuOpen(false); }} className="text-left block px-3 py-4 text-base font-medium text-gray-800 border-b border-gray-50 uppercase tracking-wider">Cart ({cartItemsCount})</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ onShopNow }: { onShopNow: () => void }) => {
  return (
    <div className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-teal-primary">
      {/* Background Video/Image Placeholder */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=2070&auto=format&fit=crop" 
          alt="Aesthetic decorated plate of all different types of Indian sweets" 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white font-bold leading-tight mb-6 drop-shadow-lg">
            Rajauli Ka Swaad,<br/>
            <span className="text-saffron italic font-light">Shaw Ji Ke Sath</span>
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-sans mb-10 max-w-2xl mx-auto">
            Handcrafted traditional sweets with a modern twist, bringing the authentic taste of Bihar to your celebrations.
          </p>
          <motion.button 
            onClick={onShopNow}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gold hover:bg-gold-light text-teal-primary font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center mx-auto space-x-2 uppercase tracking-wide"
          >
            <span>Shop Now</span>
            <ArrowRight size={20} />
          </motion.button>
        </motion.div>
      </div>

      {/* Wavy bottom divider */}
      <div className="absolute bottom-0 left-0 w-full z-20">
        <div className="wavy-divider" style={{ transform: 'rotate(180deg)' }}></div>
      </div>
    </div>
  );
};

const TrustBadges = () => {
  const badges = [
    { title: "100% Pure Desi Ghee", icon: "ð¥" },
    { title: "Handcrafted Daily", icon: "â¨" },
    { title: "No Preservatives", icon: "ð¿" }
  ];

  return (
    <div className="bg-pink-pastel/30 py-12 relative z-10 -mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {badges.map((badge, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-pink-pastel/50"
            >
              <div className="text-4xl mb-4">{badge.icon}</div>
              <h3 className="font-serif font-bold text-teal-primary text-xl">{badge.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ 
  product: any, 
  onAddToCart?: (product: any) => void,
  isWishlisted?: boolean,
  onToggleWishlist?: (product: any) => void,
  onProductClick?: (product: any) => void
}> = ({ product, onAddToCart, isWishlisted, onToggleWishlist, onProductClick }) => {
  const [averageRating, setAverageRating] = useState<string>('0.0');
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, `products/${product.id}/reviews`), (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => doc.data());
      setReviewCount(fetchedReviews.length);
      if (fetchedReviews.length > 0) {
        const avg = fetchedReviews.reduce((acc, r) => acc + r.rating, 0) / fetchedReviews.length;
        setAverageRating(avg.toFixed(1));
      } else {
        setAverageRating('0.0');
      }
    });
    return () => unsubscribe();
  }, [product.id]);

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    const rect = e.target.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x, y },
      colors: ['#D84315', '#FF8F00', '#FCE4EC', '#004D40'],
      shapes: ['circle', 'square'],
      disableForReducedMotion: true
    });

    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      onClick={() => onProductClick && onProductClick(product)}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 relative cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden bg-pink-pastel/20 p-6">
        {/* Main Image */}
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-contain transition-opacity duration-500 group-hover:opacity-0"
        />
        {/* Hover/Inner Image */}
        <img 
          src={product.hoverImage || product.image} 
          alt={`${product.name} inside`} 
          className="absolute inset-6 w-[calc(100%-3rem)] h-[calc(100%-3rem)] object-contain opacity-0 transition-opacity duration-500 group-hover:opacity-100 scale-110 group-hover:scale-100"
        />
        
        {product.isBestseller && (
          <div className="absolute top-4 left-4 bg-terracotta text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
            Bestseller
          </div>
        )}
        
        {onToggleWishlist && (
          <button 
            onClick={() => onToggleWishlist(product)}
            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-terracotta hover:bg-white transition-all z-10"
          >
            <Heart size={20} className={isWishlisted ? "fill-terracotta text-terracotta" : ""} />
          </button>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-serif font-bold text-xl text-teal-primary">{product.name}</h3>
          {reviewCount > 0 && (
            <div className="flex items-center bg-gray-50 px-2 py-1 rounded-full">
              <Star className="w-3 h-3 text-saffron fill-saffron mr-1" />
              <span className="text-xs font-bold text-gray-700">{averageRating}</span>
            </div>
          )}
        </div>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.desc}</p>
        
        <div className="flex justify-between items-end">
          <div className="font-sans font-semibold text-lg text-gray-900">
            ₹{product.price}
          </div>
          <button 
            onClick={handleAddToCart}
            className="bg-teal-primary hover:bg-teal-light text-white p-3 rounded-full transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
            aria-label="Add to cart"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ProductGallery = ({ onAddToCart, setCurrentPage, wishlist, onToggleWishlist, onProductClick }: { onAddToCart: (product: any) => void, setCurrentPage: (page: string) => void, wishlist: number[], onToggleWishlist: (product: any) => void, onProductClick: (product: any) => void }) => {
  const [activeCategory, setActiveCategory] = useState('Signature Boxes');
  const categories = ['Signature Boxes', 'Daily Delights', 'Savory Snacks', 'Festive Specials'];
  
  const filteredProducts = ALL_PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <section id="shop-mithai" className="py-20 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl text-teal-primary font-bold mb-4">The Mithai Gallery</h2>
          <p className="text-gray-600 max-w-2xl mx-auto font-sans">Discover our handcrafted delicacies, made fresh daily with love and pure desi ghee.</p>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto hide-scrollbar justify-start md:justify-center space-x-4 mb-12 pb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300",
                activeCategory === cat 
                  ? "bg-terracotta text-white shadow-md" 
                  : "bg-white text-gray-600 hover:bg-pink-pastel/50 border border-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Horizontal Scroll Gallery */}
        <motion.div 
          layout
          className="flex overflow-x-auto pb-12 gap-6 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map(product => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="min-w-[280px] max-w-[280px] sm:min-w-[320px] sm:max-w-[320px] snap-center flex-shrink-0"
              >
                <ProductCard 
                  product={product} 
                  onAddToCart={onAddToCart} 
                  isWishlisted={wishlist.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                  onProductClick={onProductClick}
                />
              </motion.div>
            ))}
            
            {/* View All Items Card */}
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              key="view-all"
              className="min-w-[280px] max-w-[280px] sm:min-w-[320px] sm:max-w-[320px] snap-center flex-shrink-0 flex items-center justify-center h-full min-h-[400px]"
            >
              <button 
                onClick={() => {
                  window.scrollTo(0, 0);
                  setCurrentPage('menu');
                }} 
                className="group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-teal-primary/30 hover:border-teal-primary hover:bg-teal-50 transition-all duration-300 w-full h-full"
              >
                <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-primary group-hover:text-white transition-all duration-300">
                  <ArrowRight className="w-8 h-8" />
                </div>
                <span className="font-serif text-xl text-teal-primary font-semibold text-center">View All Items</span>
              </button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

const SweetStory = () => {
  return (
    <section id="our-story" className="relative py-24 overflow-hidden bg-teal-primary text-white">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-saffron rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-terracotta rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-saffron">From Rajauli with Love</h2>
            <p className="text-lg mb-6 text-white/90 leading-relaxed">
              Our story begins in the heart of Rajauli, where decades ago, the first batch of our signature Chhena was lovingly prepared. What started as a small family endeavor has blossomed into a beloved local institution.
            </p>
            <p className="text-lg mb-8 text-white/90 leading-relaxed">
              We believe in preserving the authentic recipes passed down through generations while embracing a modern, joyful approach to sweets. Every piece of mithai is a testament to our commitment to quality, using only 100% pure desi ghee and the finest ingredients.
            </p>
            <button className="border-2 border-saffron text-saffron hover:bg-saffron hover:text-teal-primary font-bold py-3 px-8 rounded-full transition-colors uppercase tracking-wider text-sm">
              Read Full Story
            </button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden border-4 border-saffron/30 relative">
              <img 
                src="https://lh3.googleusercontent.com/pw/AP1GczPFvj862nPNuYL8rZtQj5Ge1pzStsaQqkyaPXgs9mBm8KWwAqdCLnQZYgYJz7Y78xH3rgXoSNWjc1efV-rgoOVHBlC7fPEmJ8JWiEJe8zi1KsEfFAI=w1000" 
                alt="Making sweets" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-primary/80 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8">
                <p className="font-serif text-2xl font-bold italic text-white">"Crafting joy, one sweet at a time."</p>
              </div>
            </div>
            {/* Decorative floating element */}
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl rotate-6">
              <img src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=150&auto=format&fit=crop&q=60" alt="Ladoo" className="w-24 h-24 rounded-xl object-cover" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const BuildABox = () => {
  return (
    <section id="gifting" className="py-24 bg-pink-pastel/20 relative">
      <div className="wavy-divider-bottom absolute top-0 left-0 w-full rotate-180"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-xl border border-pink-pastel/50 overflow-hidden relative">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#D84315 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 items-center">
            <div>
              <div className="inline-block bg-saffron text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full mb-4">
                Gifting Concierge
              </div>
              <h2 className="font-serif text-4xl md:text-5xl text-teal-primary font-bold mb-6">Build Your Own Box</h2>
              <p className="text-gray-600 text-lg mb-8">
                Create the perfect personalized gift. Mix and match your favorite mithais, choose a beautiful box, and add a custom message. The ultimate Willy Wonka experience, delivered!
              </p>
              
              <ul className="space-y-4 mb-8">
                {['Choose box size (9, 16, or 25 pieces)', 'Select your favorite sweets', 'Add a personalized greeting card'].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-700 font-medium">
                    <div className="bg-teal-light/10 p-1 rounded-full mr-3 text-teal-primary">
                      <ChevronRight size={16} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <button className="bg-terracotta hover:bg-[#bf3a11] text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all flex items-center space-x-2">
                <span>Start Building</span>
                <Plus size={20} />
              </button>
            </div>
            
            <div className="relative h-[400px] flex items-center justify-center">
              {/* Mockup of 3D box */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="relative w-full max-w-md aspect-square bg-gradient-to-br from-teal-light to-teal-primary rounded-3xl shadow-2xl p-8 transform rotate-3 border-8 border-white"
              >
                <div className="absolute inset-0 border-2 border-gold/30 m-4 rounded-xl border-dashed"></div>
                <div className="h-full w-full grid grid-cols-3 gap-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center shadow-inner">
                      {i % 2 === 0 ? <div className="w-12 h-12 bg-saffron rounded-full shadow-md"></div> : <div className="w-10 h-10 bg-pink-pastel rounded-sm shadow-md rotate-45"></div>}
                    </div>
                  ))}
                </div>
                <div className="absolute -bottom-6 -right-6 bg-gold text-teal-primary font-bold py-2 px-6 rounded-full shadow-lg transform -rotate-12 font-serif text-xl border-2 border-white">
                  Custom Box
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Location = () => {
  return (
    <section id="visit-us" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl text-teal-primary font-bold mb-4">The Rajauli Landmark</h2>
          <p className="text-gray-600 max-w-2xl mx-auto font-sans text-lg">Come visit our flagship store and experience the magic of sweet-making in person.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100">
          {/* Address Block */}
          <div className="bg-teal-primary text-white p-12 flex flex-col justify-center">
            <h3 className="font-serif text-3xl font-bold mb-8 text-saffron">Shaw Ji Sweet Shop</h3>
            
            <div className="space-y-8">
              <div className="flex items-start">
                <MapPin className="text-saffron mr-4 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-lg mb-1">Location</h4>
                  <p className="text-white/80">Main Road, Rajauli<br/>Nawada, Bihar<br/>Pincode: 805125</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="text-saffron mr-4 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-lg mb-1">Direct Line</h4>
                  <a href="tel:+917209275120" className="text-white/80 hover:text-white transition-colors text-xl font-mono block mt-1">
                    +91 7209275120
                  </a>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-saffron text-teal-primary p-1 rounded mr-4 mt-1 flex-shrink-0 font-bold px-2">
                  Hrs
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Opening Hours</h4>
                  <p className="text-white/80">Everyday: 8:00 AM - 10:00 PM</p>
                </div>
              </div>
            </div>
            
            <a href="https://www.google.com/maps/dir/?api=1&destination=Rajauli,+Nawada,+Bihar" target="_blank" rel="noopener noreferrer" className="mt-12 bg-white text-teal-primary hover:bg-gray-100 font-bold py-4 px-8 rounded-full transition-colors self-start flex items-center space-x-2">
              <MapPin size={20} />
              <span>Get Directions</span>
            </a>
          </div>
          
          {/* Map/Illustration Area */}
          <div className="relative h-[400px] lg:h-auto bg-gray-200">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d57960.62772590637!2d85.46059885!3d24.64654515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f2f70b62e49d69%3A0x6b7781b107080b0!2sRajauli%2C%20Bihar!5e0!3m2!1sen!2sin!4v1711234567890!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0, minHeight: '400px' }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Rajauli Location Map"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#1a1a1a] text-white pt-20 pb-10 border-t-8 border-terracotta">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          <div className="col-span-1 lg:col-span-2">
            <h2 className="font-serif text-4xl font-bold mb-6">
              Shaw Ji <span className="text-saffron">â§</span>
            </h2>
            <p className="text-gray-400 max-w-md mb-8">
              Traditional Indian sweets meets modern, playful, and premium aesthetic. Delivering the authentic taste of Rajauli to your doorstep.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <a href="https://instagram.com/shortlife_420" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 group">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-terracotta transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-gray-400 group-hover:text-white transition-colors font-medium">@shortlife_420</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-terracotta transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-6 uppercase tracking-wider text-saffron">Quick Links</h3>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Shop All</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Corporate Gifting</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Our Story</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-6 uppercase tracking-wider text-saffron">Join the Sweet Club</h3>
            <p className="text-gray-400 text-sm mb-4">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
            <form className="flex flex-col space-y-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-terracotta transition-colors"
              />
              <button type="submit" className="bg-terracotta hover:bg-[#bf3a11] text-white font-bold py-3 rounded-lg transition-colors">
                Subscribe
              </button>
            </form>
          </div>
          
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Shaw Ji Sweet Shop. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const WhatsAppButton = () => {
  const message = encodeURIComponent("Hi Shaw Ji, I want to order sweets in Rajauli.");
  return (
    <a 
      href={`https://wa.me/917209275120?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
      aria-label="Order on WhatsApp"
    >
      <MessageCircle size={28} />
      <span className="absolute right-full mr-4 bg-white text-gray-800 text-sm font-bold py-2 px-4 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Order on WhatsApp
      </span>
    </a>
  );
};

const FullMenu = ({ onAddToCart, wishlist, onToggleWishlist, searchQuery, onProductClick }: { onAddToCart: (product: any) => void, wishlist: number[], onToggleWishlist: (product: any) => void, searchQuery: string, onProductClick: (product: any) => void }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Signature Boxes', 'Daily Delights', 'Savory Snacks', 'Festive Specials'];

  const filteredSweets = ALL_PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-32 pb-20 bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl md:text-6xl text-teal-primary font-bold mb-4">Our Full Menu</h1>
          <p className="text-gray-600 max-w-2xl mx-auto font-sans text-lg">Explore our complete collection of {ALL_PRODUCTS.length} handcrafted Indian sweets and savories.</p>
        </div>
        
        {/* Categories */}
        <div className="flex overflow-x-auto hide-scrollbar justify-start md:justify-center space-x-4 mb-12 pb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300",
                activeCategory === cat 
                  ? "bg-terracotta text-white shadow-md" 
                  : "bg-white text-gray-600 hover:bg-pink-pastel/50 border border-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredSweets.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart} 
              isWishlisted={wishlist.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              onProductClick={onProductClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};



const CartPage = ({ cartItems, setCartItems, setCurrentPage, user, onLoginClick }: { cartItems: any[], setCartItems: any, setCurrentPage: any, user: any, onLoginClick: () => void }) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const updateQuantity = (id: number, delta: number) => {
    setCartItems((prev: any[]) => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (id: number) => {
    setCartItems((prev: any[]) => prev.filter(item => item.id !== id));
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!user) {
      onLoginClick();
      return;
    }

    setCurrentPage('checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="pt-32 pb-20 bg-[#FAFAFA] min-h-screen flex flex-col items-center justify-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center max-w-lg w-full">
          <div className="w-24 h-24 bg-pink-pastel/30 rounded-full flex items-center justify-center mx-auto mb-6 text-terracotta">
            <ShoppingBag size={48} />
          </div>
          <h2 className="font-serif text-3xl text-teal-primary font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added any of our delicious sweets to your cart yet.</p>
          <button 
            onClick={() => setCurrentPage('menu')}
            className="bg-teal-primary hover:bg-teal-light text-white font-bold py-3 px-8 rounded-full transition-colors shadow-md"
          >
            Explore Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl md:text-5xl text-teal-primary font-bold mb-12">Your Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map(item => (
              <div key={item.id} className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 bg-pink-pastel/20 rounded-2xl p-2 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-serif font-bold text-xl text-teal-primary mb-1">{item.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">₹{item.price} per box</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-gray-50 rounded-full border border-gray-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-terracotta transition-colors">-</button>
                    <span className="w-8 text-center font-semibold text-gray-800">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-teal-primary transition-colors">+</button>
                  </div>
                  <div className="font-sans font-bold text-lg text-gray-900 w-20 text-right">
                    ₹{item.price * item.quantity}
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-32">
              <h3 className="font-serif font-bold text-2xl text-teal-primary mb-6">Order Summary</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
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
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-gold hover:bg-gold-light text-teal-primary font-bold py-4 rounded-xl transition-colors shadow-md uppercase tracking-wider disabled:opacity-70"
              >
                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        if (!('Notification' in window)) {
          console.log('This browser does not support desktop notification');
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          let swRegistration = null;
          if ('serviceWorker' in navigator) {
            swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          }

          const msg = await messaging();
          if (msg) {
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY_HERE';
            const token = await getToken(msg, {
              vapidKey: vapidKey,
              serviceWorkerRegistration: swRegistration || undefined
            });
            
            if (token) {
              console.log('FCM Token:', token);
              await setDoc(doc(db, 'admin', 'device'), { token }, { merge: true });
              console.log('FCM Token saved to admin/device');
            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          }
        } else {
          console.log('Notification permission denied.');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    };

    requestNotificationPermission();

    const setupForegroundListener = async () => {
      try {
        const msg = await messaging();
        if (msg) {
          onMessage(msg, (payload) => {
            console.log('Message received. ', payload);
            if (payload.notification) {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification(payload.notification?.title || 'New Notification', {
                    body: payload.notification?.body,
                    icon: '/vite.svg',
                    data: payload.data
                  });
                });
              } else {
                alert(`${payload.notification.title}\n${payload.notification.body}`);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error setting up foreground listener:', error);
      }
    };

    setupForegroundListener();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || ''
        });
      } else {
        setUser(null);
        setWishlist([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch wishlist
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, `users/${user.id}/wishlist`), (snapshot) => {
      const wishlistIds = snapshot.docs.map(doc => doc.data().productId);
      setWishlist(wishlistIds);
    }, (error) => {
      console.error("Error fetching wishlist:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const handleToggleWishlist = async (product: any) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    
    try {
      const isWishlisted = wishlist.includes(product.id);
      if (isWishlisted) {
        await deleteDoc(doc(db, `users/${user.id}/wishlist`, product.id.toString()));
      } else {
        await setDoc(doc(db, `users/${user.id}/wishlist`, product.id.toString()), {
          productId: product.id,
          addedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      if (currentPage === 'profile') {
        setCurrentPage('home');
      }
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans">
      <CreatorBadge />
      <Ticker />
      <Navbar 
        setCurrentPage={setCurrentPage} 
        cartItemsCount={cartItemsCount} 
        user={user}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentPage={currentPage}
      />
      <main>
        {currentPage === 'home' ? (
          <>
            <Hero onShopNow={() => setCurrentPage('menu')} />
            <TrustBadges />
            <ProductGallery onAddToCart={addToCart} setCurrentPage={setCurrentPage} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onProductClick={setSelectedProduct} />
            <SweetStory />
            <BuildABox />
            <Location />
          </>
        ) : currentPage === 'menu' ? (
          <FullMenu onAddToCart={addToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} searchQuery={searchQuery} onProductClick={setSelectedProduct} />
        ) : currentPage === 'profile' ? (
          <ProfileDashboard user={user} onLogout={handleLogout} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} />
        ) : currentPage === 'cart' ? (
          <CartPage cartItems={cartItems} setCartItems={setCartItems} setCurrentPage={setCurrentPage} user={user} onLoginClick={() => setIsAuthModalOpen(true)} />
        ) : currentPage === 'checkout' ? (
          <CheckoutPage cartItems={cartItems} setCartItems={setCartItems} setCurrentPage={setCurrentPage} user={user} />
        ) : null}
      </main>
      <Footer />
      <WhatsAppButton />

      {/* Floating Cart Banner */}
      <AnimatePresence>
        {cartItemsCount > 0 && currentPage !== 'cart' && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-50 pointer-events-none"
          >
            <div className="max-w-md mx-auto pointer-events-auto">
              <div className="bg-teal-primary text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-teal-700/50 backdrop-blur-md bg-teal-primary/95">
                <div className="flex flex-col">
                  <span className="font-medium text-lg">{cartItemsCount} item{cartItemsCount > 1 ? 's' : ''} added</span>
                  <span className="text-teal-100 font-medium">₹{cartTotal}</span>
                </div>
                <button 
                  onClick={() => setCurrentPage('cart')}
                  className="bg-white text-teal-primary px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Go to Cart
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={(userData) => {
          setUser(userData);
          setIsAuthModalOpen(false);
        }} 
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onAddToCart={addToCart}
        user={user}
      />
    </div>
  );
}
