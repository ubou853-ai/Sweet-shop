import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ShoppingBag, Loader2 } from 'lucide-react';
import { db, collection, addDoc, query, getDocs, onSnapshot } from '../firebase';
import { cn } from '../lib/utils';

export const ProductDetailsModal = ({ 
  isOpen, 
  onClose, 
  product, 
  onAddToCart,
  user
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  product: any, 
  onAddToCart: (product: any) => void,
  user: any
}) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !product) return;

    const unsubscribe = onSnapshot(collection(db, `products/${product.id}/reviews`), (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedReviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(fetchedReviews);
      setIsLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [isOpen, product]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to submit a review.");
      return;
    }
    if (!newReview.comment.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `products/${product.id}/reviews`), {
        userId: user.id,
        userName: user.name,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: new Date().toISOString()
      });
      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col md:flex-row overflow-y-auto">
            {/* Product Image & Info */}
            <div className="md:w-1/2 bg-pink-pastel/20 p-8 flex flex-col items-center justify-center relative">
              <img src={product.image} alt={product.name} className="w-full max-w-sm object-contain drop-shadow-xl mb-8" />
              <div className="text-center">
                <h2 className="font-serif text-3xl text-teal-primary font-bold mb-2">{product.name}</h2>
                <p className="text-gray-600 mb-4">{product.desc}</p>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <span className="font-sans text-2xl font-bold text-gray-900">₹{product.price}</span>
                  <div className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm">
                    <Star className="w-4 h-4 text-saffron fill-saffron mr-1" />
                    <span className="font-bold text-sm">{averageRating}</span>
                    <span className="text-gray-400 text-xs ml-1">({reviews.length})</span>
                  </div>
                </div>
                <button 
                  onClick={() => { onAddToCart(product); onClose(); }}
                  className="bg-teal-primary hover:bg-teal-light text-white px-8 py-3 rounded-full font-bold transition-colors shadow-md flex items-center justify-center mx-auto gap-2"
                >
                  <ShoppingBag size={20} /> Add to Cart
                </button>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="md:w-1/2 p-8 bg-white flex flex-col">
              <h3 className="font-serif text-2xl text-teal-primary font-bold mb-6 border-b pb-4">Customer Reviews</h3>
              
              <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-6">
                {isLoadingReviews ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-primary" /></div>
                ) : reviews.length === 0 ? (
                  <p className="text-gray-500 text-center italic py-8">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map(review => (
                    <div key={review.id} className="bg-gray-50 p-4 rounded-2xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-900">{review.userName}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className={i < review.rating ? "text-saffron fill-saffron" : "text-gray-300"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                      <span className="text-xs text-gray-400 mt-2 block">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Add Review Form */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-auto">
                <h4 className="font-bold text-gray-900 mb-4">Write a Review</h4>
                {user ? (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Rating:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="p-1 focus:outline-none"
                          >
                            <Star size={20} className={star <= newReview.rating ? "text-saffron fill-saffron" : "text-gray-300"} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="Share your experience..."
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-primary/20 focus:border-teal-primary outline-none resize-none h-24"
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !newReview.comment.trim()}
                      className="w-full bg-teal-primary text-white py-2 rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Submit Review"}
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-gray-500 text-center">Please login to write a review.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
