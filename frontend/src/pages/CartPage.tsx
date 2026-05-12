import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, ShieldCheck, Minus, Plus, Check } from 'lucide-react';
import { cartAPI } from '../services/api';
import { pageVariants, staggerContainer, staggerItem, buttonTap, cardHover } from '../utils/motion';
import { useAppDispatch, useAppSelector } from '../store';
import { setCart } from '../store/slices/cartSlice';
import { formatCurrency, getProductImage } from '../utils';
import toast from 'react-hot-toast';

const CartPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { cart, isLoading } = useAppSelector((s) => s.cart);
  const [selected, setSelected] = useState<Set<string>>(new Set(cart?.items?.map((i) => i._id) || []));

  React.useEffect(() => {
    if (cart?.items) setSelected(new Set(cart.items.map((i) => i._id)));
  }, [cart?.items?.length]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === (cart?.items?.length || 0)) setSelected(new Set());
    else setSelected(new Set(cart?.items?.map((i) => i._id) || []));
  };

  const removeSelected = async () => {
    for (const id of selected) {
      try { const r = await cartAPI.removeItem(id); dispatch(setCart(r.data.data)); }
      catch { toast.error('Failed to remove some items'); }
    }
    setSelected(new Set());
    toast.success('Removed selected items');
  };

  const update = async (itemId: string, qty: number) => {
    if (qty < 1) { try { const r = await cartAPI.removeItem(itemId); dispatch(setCart(r.data.data)); } catch { toast.error('Failed'); } return; }
    try { const r = await cartAPI.updateItem(itemId, qty); dispatch(setCart(r.data.data)); }
    catch { toast.error('Failed to update'); }
  };

  const selectedItems = cart?.items?.filter((i) => selected.has(i._id)) || [];
  const subtotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 0 && subtotal < 50 ? 9.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-12"><div className="skeleton h-64 rounded-xl" /></div>;

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-slate-500 mb-6">
        <Link to="/" className="hover:text-green-600">Home</Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-medium">Cart</span>
      </nav>

      {!cart?.items?.length ? (
        <div className="text-center py-20 border border-slate-200 rounded-xl bg-slate-50">
          <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 text-sm mb-6">Add products to get started</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Items */}
          <div>
            {/* Header row */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <h1 className="text-[16px] font-bold text-slate-900">
                  Shopping Cart <span className="text-slate-400 font-normal text-sm">({cart.items.length})</span>
                </h1>
              </div>

              {/* Items list */}
              <div className="divide-y divide-slate-100">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex gap-4 p-4 items-start">
                    {/* Checkbox */}
                    <button onClick={() => toggleSelect(item._id)}
                      className={`mt-1 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                        selected.has(item._id) ? 'bg-green-600 border-green-600' : 'border-slate-300 hover:border-green-400'
                      }`}>
                      {selected.has(item._id) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </button>

                    {/* Image */}
                    <Link to={`/products/${item.product.slug}`} className="flex-shrink-0">
                      <img src={getProductImage(item.product.images)} alt={item.product.name}
                        className="w-[72px] h-[72px] object-cover rounded-xl border border-slate-200 bg-slate-100" />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.product.slug}`}
                        className="text-[13px] font-semibold text-slate-800 hover:text-green-600 line-clamp-2 leading-snug transition-colors">
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {typeof item.product.category === 'object' ? item.product.category.name : ''}
                      </p>
                      <p className="text-[14px] font-bold text-green-600 mt-1">{formatCurrency(item.price)}</p>
                    </div>

                    {/* Qty + remove */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                        <button onClick={() => update(item._id, item.quantity - 1)}
                          className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1.5 text-[13px] font-semibold text-slate-800 border-x border-slate-200 min-w-[36px] text-center">
                          {item.quantity}
                        </span>
                        <button onClick={() => update(item._id, item.quantity + 1)}
                          className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[14px] font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                      <button onClick={() => update(item._id, 0)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button onClick={toggleAll}
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                      selected.size === cart.items.length ? 'bg-green-600 border-green-600' : 'border-slate-300 hover:border-green-400'
                    }`}>
                    {selected.size === cart.items.length && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </button>
                  <span className="text-sm font-medium text-slate-700">Select All</span>
                </label>
                {selected.size > 0 && (
                  <button onClick={removeSelected} className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors">
                    Remove Selected ({selected.size})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 h-fit sticky top-28">
            <h3 className="text-[15px] font-bold text-slate-900 mb-4">Order Summary</h3>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({selectedItems.length} items)</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className={`font-semibold ${shipping === 0 && subtotal > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                  {subtotal === 0 ? '-' : shipping === 0 ? 'Free' : formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (8%)</span>
                <span className="font-semibold text-slate-900">{subtotal > 0 ? formatCurrency(tax) : '-'}</span>
              </div>
            </div>
            {subtotal > 0 && subtotal < 50 && (
              <p className="text-[11px] text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mt-3">
                Add {formatCurrency(50 - subtotal)} more for free shipping
              </p>
            )}
            <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between text-[15px] font-bold text-slate-900">
              <span>Total</span>
              <span>{subtotal > 0 ? formatCurrency(total) : '-'}</span>
            </div>

            <button onClick={() => navigate('/checkout')} disabled={selectedItems.length === 0}
              className="btn-primary w-full py-3 mt-4 text-sm disabled:opacity-50">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 justify-center mt-3">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[11px] text-slate-500">Secure Checkout</p>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              {['VISA', 'MC', 'AMEX', 'PayPal'].map((m) => (
                <span key={m} className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{m}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
export { CartPage };
