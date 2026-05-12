import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Minus, Plus, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cartAPI } from '../services/api';
import { useAppDispatch, useAppSelector } from '../store';
import { setCart } from '../store/slices/cartSlice';
import { formatCurrency, getProductImage } from '../utils';

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
      try {
        const r = await cartAPI.removeItem(id);
        dispatch(setCart(r.data.data));
      } catch {
        toast.error('Failed to remove some items');
      }
    }
    setSelected(new Set());
    toast.success('Removed selected items');
  };

  const update = async (itemId: string, qty: number) => {
    if (qty < 1) {
      try {
        const r = await cartAPI.removeItem(itemId);
        dispatch(setCart(r.data.data));
        toast.success('Removed from cart');
      } catch {
        toast.error('Failed to remove item');
      }
      return;
    }
    try {
      const r = await cartAPI.updateItem(itemId, qty);
      dispatch(setCart(r.data.data));
    } catch {
      toast.error('Failed to update cart');
    }
  };

  const selectedItems = cart?.items?.filter((i) => selected.has(i._id)) || [];
  const subtotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 0 && subtotal < 50 ? 9.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (isLoading) {
    return (
      <div className="page-container pt-28 pb-16">
        <div className="skeleton h-72" />
      </div>
    );
  }

  return (
    <div className="page-container pt-28 pb-16">
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-brand-dark dark:hover:text-brand-primary">Home</Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">Cart</span>
      </nav>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Checkout</p>
          <h1 className="heading-1">Shopping Cart</h1>
          <p className="body-copy mt-2">{cart?.items?.length || 0} item{cart?.items?.length === 1 ? '' : 's'} in your cart.</p>
        </div>
        {!!cart?.items?.length && (
          <button onClick={toggleAll} className="btn-secondary">
            {selected.size === cart.items.length ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      {!cart?.items?.length ? (
        <div className="glass rounded-2xl border border-dashed border-slate-300 py-20 text-center dark:border-white/10">
          <ShoppingCart className="mx-auto mb-5 h-14 w-14 text-slate-300" />
          <h2 className="heading-3 mb-2">Your cart is empty</h2>
          <p className="body-copy mx-auto mb-6 max-w-sm">Add a few products and they will appear here ready for checkout.</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <section className="surface overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
              <h2 className="text-base font-bold text-slate-950 dark:text-white">Selected items</h2>
              {selected.size > 0 && (
                <button onClick={removeSelected} className="text-sm font-semibold text-red-600 hover:text-red-700">
                  Remove selected ({selected.size})
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-200/80 dark:divide-white/10">
              {cart.items.map((item) => (
                <div key={item._id} className="grid grid-cols-[auto_72px_1fr] gap-4 p-4 sm:grid-cols-[auto_88px_1fr_auto] sm:items-center">
                  <button
                    onClick={() => toggleSelect(item._id)}
                    className={`mt-1 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all sm:mt-0 ${
                      selected.has(item._id)
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-slate-300 hover:border-brand-primary dark:border-white/20'
                    }`}
                    aria-label="Select cart item"
                  >
                    {selected.has(item._id) && <Check className="h-3 w-3" strokeWidth={3} />}
                  </button>

                  <Link to={`/products/${item.product.slug}`} className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-800">
                    <img src={getProductImage(item.product.images)} alt={item.product.name} loading="lazy" className="h-[72px] w-[72px] object-cover sm:h-[88px] sm:w-[88px]" />
                  </Link>

                  <div className="min-w-0">
                    <Link to={`/products/${item.product.slug}`} className="line-clamp-2 text-sm font-bold text-slate-900 transition-colors hover:text-brand-dark dark:text-white dark:hover:text-brand-primary">
                      {item.product.name}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">{typeof item.product.category === 'object' ? item.product.category.name : ''}</p>
                    <p className="mt-2 text-sm font-bold text-brand-dark dark:text-brand-primary">{formatCurrency(item.price)}</p>
                  </div>

                  <div className="col-span-2 col-start-2 flex items-center justify-between gap-4 sm:col-span-1 sm:col-start-auto sm:flex-col sm:items-end">
                    <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                      <button onClick={() => update(item._id, item.quantity - 1)} className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-10 border-x border-slate-200 px-3 text-center text-sm font-bold text-slate-900 dark:border-white/10 dark:text-white">{item.quantity}</span>
                      <button onClick={() => update(item._id, item.quantity + 1)} className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-extrabold text-slate-950 dark:text-white">{formatCurrency(item.price * item.quantity)}</p>
                      <button onClick={() => update(item._id, 0)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="surface h-fit rounded-2xl p-5 shadow-lift lg:sticky lg:top-28">
            <h3 className="mb-4 text-base font-bold text-slate-950 dark:text-white">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal ({selectedItems.length} items)</span>
                <span className="font-semibold text-slate-950 dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Shipping</span>
                <span className={`font-semibold ${shipping === 0 && subtotal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-950 dark:text-white'}`}>
                  {subtotal === 0 ? '-' : shipping === 0 ? 'Free' : formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Tax (8%)</span>
                <span className="font-semibold text-slate-950 dark:text-white">{subtotal > 0 ? formatCurrency(tax) : '-'}</span>
              </div>
            </div>

            {subtotal > 0 && subtotal < 50 && (
              <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                Add {formatCurrency(50 - subtotal)} more for free shipping.
              </p>
            )}

            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-extrabold text-slate-950 dark:border-white/10 dark:text-white">
              <span>Total</span>
              <span>{subtotal > 0 ? formatCurrency(total) : '-'}</span>
            </div>

            <button onClick={() => navigate('/checkout')} disabled={selectedItems.length === 0} className="btn-primary mt-5 w-full">
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              Secure checkout
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default CartPage;
export { CartPage };
