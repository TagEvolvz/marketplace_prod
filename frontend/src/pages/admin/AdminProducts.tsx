import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit3, Trash2, Loader2, X, Upload, Package,
  ChevronDown, Pill, ShoppingBag, Sparkles, RefreshCw, Wand2,
} from 'lucide-react';
import { productAPI, storeCategoryAPI, aiAPI } from '../../services/api';
import { formatCurrency, getProductImage } from '../../utils';
import { staggerContainer, staggerItem, scaleIn, buttonTap } from '../../utils/motion';
import toast from 'react-hot-toast';

// ─── Product Form (designed for non-tech users) ────────────────────────────────
const ProductForm: React.FC<{ product?: any; onClose: () => void; onSuccess: () => void }> = ({ product, onClose, onSuccess }) => {
  const isEdit = !!product;

  const [form, setForm] = useState({
    name:              product?.name || '',
    description:       product?.description || '',
    price:             product?.price || '',
    compareAtPrice:    product?.compareAtPrice || '',
    stock:             product?.stock || '',
    category:          (typeof product?.category === 'object' ? product.category._id : product?.category) || '',
    subcategory:       (typeof product?.subcategory === 'object' ? product.subcategory?._id : product?.subcategory) || '',
    storeSection:      product?.storeSection || '',
    prescriptionRequired: product?.prescriptionRequired || false,
    lowStockThreshold: product?.lowStockThreshold || 5,
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const { data: catData } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => storeCategoryAPI.getAll().then((r) => r.data.data),
  });
  const allCategories: any[] = catData?.data || catData || [];

  // Filter categories by section
  const parentCats = allCategories.filter((c) => !c.parent && (!form.storeSection || c.storeSection === form.storeSection));
  const selectedParent = allCategories.find((c) => c._id === form.category);
  const subcats: any[] = selectedParent?.children || allCategories.filter((c) =>
    c.parent && (typeof c.parent === 'string' ? c.parent : c.parent?._id?.toString()) === form.category
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) { toast.error('Maximum 5 images allowed'); return; }
    setImages((p) => [...p, ...files]);
    setPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const handleGenerateDescription = async () => {
    if (!form.name || !form.storeSection) { toast.error('Enter product name and select a store section first'); return; }
    setGeneratingDesc(true);
    try {
      const selectedCat = allCategories.find((c) => c._id === form.category);
      const res = await aiAPI.generateDescription({
        name: form.name,
        category: selectedCat?.name || form.storeSection,
        price: parseFloat(form.price) || 0,
        storeSection: form.storeSection,
      });
      setForm((p) => ({ ...p, description: res.data.data.description }));
      toast.success('Description generated');
    } catch { toast.error('Could not generate description. Write it manually.'); }
    finally { setGeneratingDesc(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock || !form.category) {
      toast.error('Please fill in all required fields'); return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== undefined) fd.append(k, String(v)); });
      images.forEach((img) => fd.append('images', img));
      if (isEdit) {
        await productAPI.updateProduct(product._id, fd);
        toast.success('Product updated successfully');
      } else {
        await productAPI.createProduct(fd);
        toast.success('Product added successfully');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setSaving(false); }
  };

  const SECTION_OPTIONS = [
    { value: 'supermarket', label: 'Supermarket', icon: <ShoppingBag className="w-4 h-4 text-slate-700" /> },
    { value: 'pharmacy', label: 'Pharmacy', icon: <Pill className="w-4 h-4 text-blue-600" /> },
    { value: 'cosmetics', label: 'Cosmetics', icon: <Sparkles className="w-4 h-4 text-rose-500" /> },
  ];

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate" exit="exit"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="light-form-surface relative bg-white text-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl mb-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Store Section */}
          <div>
            <label className="label">Store Section *</label>
            <div className="grid grid-cols-3 gap-2">
              {SECTION_OPTIONS.map((s) => (
                <motion.button key={s.value} type="button" whileTap={buttonTap}
                  onClick={() => setForm({ ...form, storeSection: s.value, category: '', subcategory: '' })}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-[13px] font-semibold transition-all ${
                    form.storeSection === s.value
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  {s.icon} {s.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Product name */}
          <div>
            <label className="label">Product Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="What is this product called?" className="input" required />
          </div>

          {/* Category + Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <div className="relative">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: '' })}
                  className="input appearance-none pr-8" required>
                  <option value="">Select category</option>
                  {parentCats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="label">Subcategory</label>
              <div className="relative">
                <select value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                  className="input appearance-none pr-8" disabled={!form.category || subcats.length === 0}>
                  <option value="">Select subcategory</option>
                  {subcats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Selling Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                <input type="number" min="0" step="0.01" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00" className="input pl-7" required />
              </div>
            </div>
            <div>
              <label className="label">Original Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                <input type="number" min="0" step="0.01" value={form.compareAtPrice}
                  onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                  placeholder="0.00" className="input pl-7" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">For showing discount</p>
            </div>
            <div>
              <label className="label">How many in stock? *</label>
              <input type="number" min="0" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="0" className="input" required />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Product Description</label>
              <motion.button type="button" onClick={handleGenerateDescription} disabled={generatingDesc} whileTap={buttonTap}
                className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-slate-900 font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {generatingDesc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                Generate with AI
              </motion.button>
            </div>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="Describe what this product is and its key benefits..."
              className="input resize-none" />
          </div>

          {/* Pharmacy fields */}
          {form.storeSection === 'pharmacy' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Pill className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-blue-800">Prescription Required?</p>
                <p className="text-[11px] text-blue-600">Enable this for regulated medicines</p>
              </div>
              <button type="button" onClick={() => setForm({ ...form, prescriptionRequired: !form.prescriptionRequired })}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.prescriptionRequired ? 'bg-blue-600' : 'bg-slate-200'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.prescriptionRequired ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </motion.div>
          )}

          {/* Images */}
          <div>
            <label className="label">Product Photos</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-slate-300 hover:bg-slate-50/30 transition-all">
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
              <Upload className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-[13px] font-semibold text-slate-600">Click to upload photos</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PNG or JPG, up to 5MB each (max 5 photos)</p>
            </label>
            {(previews.length > 0 || (isEdit && product.images?.length > 0)) && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {previews.length > 0
                  ? previews.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                        <button type="button" onClick={() => {
                          setImages((p) => p.filter((_, idx) => idx !== i));
                          setPreviews((p) => p.filter((_, idx) => idx !== i));
                        }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  : product?.images?.slice(0, 5).map((img: any, i: number) => (
                      <img key={i} src={img.url} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-slate-100" />
                    ))
                }
              </div>
            )}
          </div>

          {/* Low stock alert */}
          <div>
            <label className="label">Low Stock Alert (send alert when stock drops to)</label>
            <input type="number" min="0" value={form.lowStockThreshold}
              onChange={(e) => setForm({ ...form, lowStockThreshold: parseInt(e.target.value) || 5 })}
              className="input w-32" />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <motion.button type="submit" disabled={saving} whileTap={buttonTap}
              className="btn-primary flex-1 py-3 disabled:opacity-60">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : isEdit ? 'Update Product' : 'Add Product'
              }
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

// ─── AdminProducts page ────────────────────────────────────────────────────────
const AdminProducts: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, sectionFilter],
    queryFn: () => productAPI.getProducts({
      search: search || undefined,
      storeSection: sectionFilter || undefined,
      limit: 60,
      status: 'all',
    }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productAPI.deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Product deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const products: any[] = data?.data || data?.products || [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Catalog</p>
          <h1 className="heading-1">Products</h1>
          <p className="body-copy mt-2">{products.length} total products</p>
        </div>
        <motion.button onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-extrabold text-slate-950 shadow-lift ring-2 ring-brand-primary/25 transition-all hover:-translate-y-0.5 hover:bg-brand-neon focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/30"
          whileHover={{ scale: 1.02 }} whileTap={buttonTap}>
          <Plus className="w-4 h-4" /> Add New Product
        </motion.button>
      </div>

      {/* Filters */}
      <div className="admin-card mb-6 flex flex-wrap gap-3 p-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search products..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input pl-9 text-[13px]" />
        </div>
        <div className="flex gap-2">
          {[
            { value: '', label: 'All', icon: null },
            { value: 'supermarket', label: 'Supermarket', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
            { value: 'pharmacy', label: 'Pharmacy', icon: <Pill className="w-3.5 h-3.5" /> },
            { value: 'cosmetics', label: 'Cosmetics', icon: <Sparkles className="w-3.5 h-3.5" /> },
          ].map((s) => (
            <button key={s.value} onClick={() => setSectionFilter(s.value)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-all ${
                sectionFilter === s.value ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 text-xs font-extrabold text-brand-dark transition-colors hover:bg-brand-primary hover:text-slate-950 sm:hidden"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="surface-muted rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm mb-4">No products found</p>
          <button onClick={() => setShowForm(true)} className="btn-secondary btn-sm">Add Your First Product</button>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <motion.div key={product._id} variants={staggerItem}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <div className="aspect-video bg-slate-100 overflow-hidden relative">
                <img src={getProductImage(product.images)} alt={product.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 flex gap-1">
                  {product.storeSection && (
                    <span className="bg-black/40 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
                      {product.storeSection}
                    </span>
                  )}
                  {product.prescriptionRequired && (
                    <span className="bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Pill className="w-2.5 h-2.5" /> Rx
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <p className="text-[11px] text-slate-400 mb-0.5">
                  {typeof product.category === 'object' ? product.category.name : ''}
                </p>
                <h3 className="text-[13px] font-bold text-slate-800 line-clamp-1 mb-2">{product.name}</h3>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-extrabold text-slate-900">{formatCurrency(product.price)}</span>
                    {product.compareAtPrice > product.price && (
                      <span className="text-xs text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
                    )}
                  </div>
                  <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    product.stock > (product.lowStockThreshold || 5)
                      ? 'bg-slate-100 text-slate-700'
                      : product.stock > 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <motion.button onClick={() => { setEditProduct(product); setShowForm(true); }} whileTap={buttonTap}
                    className="btn-secondary btn-sm flex flex-1 items-center justify-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </motion.button>
                  <motion.button onClick={() => window.confirm('Delete this product?') && deleteMutation.mutate(product._id)}
                    disabled={deleteMutation.isPending} whileTap={buttonTap}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 py-1.5 transition-colors disabled:opacity-50">
                    {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <ProductForm product={editProduct}
            onClose={() => { setShowForm(false); setEditProduct(null); }}
            onSuccess={() => qc.invalidateQueries({ queryKey: ['admin-products'] })} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;
