import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, ShoppingCart } from 'lucide-react';
import { authAPI, cartAPI } from '../services/api';
import { useAppDispatch } from '../store';
import { setCart } from '../store/slices/cartSlice';
import { formatCurrency, getProductImage } from '../utils';
import toast from 'react-hot-toast';

const WishlistPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => authAPI.getWishlist().then((r: any) => r.data.data),
  });
  const items = data || [];

  const addToCart = async (productId: string) => {
    try {
      const r = await cartAPI.addItem({ productId, quantity: 1 });
      dispatch(setCart(r.data.data));
      toast.success('Added to cart');
    } catch { toast.error('Failed to add'); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link to="/" className="hover:text-green-600">Home</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Wishlist</span>
      </nav>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Wishlist</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton aspect-square rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-16 text-center">
          <Heart className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 mb-1">Your wishlist is empty</h3>
          <p className="text-sm text-slate-500 mb-5">Save items you love to buy them later</p>
          <Link to="/products" className="btn-primary inline-flex">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((product: any) => (
            <div key={product._id} className="card-hover group overflow-hidden">
              <Link to={`/products/${product.slug}`} className="block">
                <div className="aspect-square overflow-hidden bg-slate-100">
                  <img src={getProductImage(product.images)} alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3.5">
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1">{product.name}</h3>
                  <p className="text-base font-bold text-slate-900">{formatCurrency(product.effectivePrice)}</p>
                </div>
              </Link>
              <div className="px-3.5 pb-3.5">
                <button onClick={() => addToCart(product._id)} className="btn-primary w-full text-xs py-2 gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
