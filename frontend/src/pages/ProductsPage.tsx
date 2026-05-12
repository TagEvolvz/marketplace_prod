import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, X, ChevronDown, ChevronRight, Search,
  Pill, ShoppingBag, Sparkles, Package, Loader2
} from 'lucide-react';
import { productAPI, storeCategoryAPI, aiAPI } from '../services/api';
import { Product } from '../types';
import { useDebounce } from '../hooks';
import { staggerContainer, staggerItem, buttonTap } from '../utils/motion';
import { ProductCard } from './HomePage';

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'createdAt:desc' },
  { label: 'Price: Low to High', value: 'price:asc' },
  { label: 'Price: High to Low', value: 'price:desc' },
  { label: 'Best Rated', value: 'rating:desc' },
  { label: 'Best Sellers', value: 'totalSold:desc' },
];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  pharmacy:    <Pill className="w-4 h-4 text-blue-500" />,
  supermarket: <ShoppingBag className="w-4 h-4 text-brand-primary" />,
  cosmetics:   <Sparkles className="w-4 h-4 text-rose-400" />,
};

interface Filters {
  section: string;
  category: string;
  subcategory: string;
  minPrice: string;
  maxPrice: string;
  rating: string;
}

const FilterSidebar: React.FC<{
  filters: Filters;
  categories: any[];
  onChange: (f: Partial<Filters>) => void;
  onApplyPrice: () => void;
}> = ({ filters, categories, onChange, onApplyPrice }) => {
  const [localMin, setLocalMin] = useState(filters.minPrice);
  const [localMax, setLocalMax] = useState(filters.maxPrice);

  const parentCats = categories.filter((c) => !c.parent);

  return (
    <div className="space-y-6">
      {/* Store Section */}
      <div className="bg-white/5 dark:bg-dark-800/50 border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
          <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Store Section</h3>
        </div>
        <div className="p-2">
          {[
            { value: '', label: 'All Sections', icon: <Package className="w-4 h-4" /> },
            { value: 'pharmacy', label: 'Pharmacy', icon: <Pill className="w-4 h-4 text-blue-400" /> },
            { value: 'supermarket', label: 'Supermarket', icon: <ShoppingBag className="w-4 h-4 text-brand-neon" /> },
            { value: 'cosmetics', label: 'Cosmetics', icon: <Sparkles className="w-4 h-4 text-rose-400" /> },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => onChange({ section: s.value, category: '', subcategory: '' })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative overflow-hidden group ${
                filters.section === s.value
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              {filters.section === s.value && (
                <motion.div
                  layoutId="glow-bg"
                  className="absolute inset-0 bg-brand-primary/5 blur-md"
                />
              )}
              <motion.span
                animate={filters.section === s.value ? { y: [0, -4, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={filters.section === s.value ? 'text-brand-primary' : 'text-slate-400'}
              >
                {s.icon}
              </motion.span>
              <span className="relative z-10">{s.label}</span>
              {filters.section === s.value && (
                <motion.div
                  layoutId="active-dot"
                  className="w-1.5 h-1.5 rounded-full bg-brand-neon ml-auto shadow-[0_0_12px_#39FF14]"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {parentCats.length > 0 && (
        <div className="bg-white/5 dark:bg-dark-800/50 border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Categories</h3>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto scrollbar-thin">
            <button
              onClick={() => onChange({ category: '', subcategory: '' })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                !filters.category ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              All Categories
            </button>
            {(filters.section ? parentCats.filter((c) => c.storeSection === filters.section) : parentCats).map((cat) => (
              <React.Fragment key={cat._id}>
                <button
                  onClick={() => onChange({ category: cat._id, subcategory: '' })}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    filters.category === cat._id ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="opacity-50">{SECTION_ICONS[cat.storeSection] || <Package className="w-4 h-4" />}</span>
                  {cat.name}
                </button>
                {filters.category === cat._id && cat.children?.map((sub: any) => (
                  <button
                    key={sub._id}
                    onClick={() => onChange({ subcategory: sub._id })}
                    className={`w-full flex items-center gap-3 pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      filters.subcategory === sub._id ? 'text-brand-neon' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div className={`w-1 h-1 rounded-full ${filters.subcategory === sub._id ? 'bg-brand-neon shadow-[0_0_8px_#39FF14]' : 'bg-slate-600'}`} />
                    {sub.name}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="bg-white/5 dark:bg-dark-800/50 border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Price Range</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">$</span>
              <input
                type="number" placeholder="Min" value={localMin} onChange={(e) => setLocalMin(e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl py-2 pl-6 pr-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">$</span>
              <input
                type="number" placeholder="Max" value={localMax} onChange={(e) => setLocalMax(e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl py-2 pl-6 pr-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          </div>
          <button
            onClick={() => { onChange({ minPrice: localMin, maxPrice: localMax }); onApplyPrice(); }}
            className="w-full btn-primary !py-2.5 !rounded-xl !text-xs group relative overflow-hidden"
          >
            <span className="relative z-10">Apply Range</span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── AI Result Banner ──────────────────────────────────────────────────
const AIResultBanner: React.FC<{ interpretation: string; onClear: () => void }> = ({ interpretation, onClear }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className="relative group p-px bg-brand-gradient rounded-3xl mb-12 overflow-hidden shadow-[0_0_30px_rgba(57,255,20,0.15)] hover:shadow-[0_0_50px_rgba(57,255,20,0.3)] transition-shadow duration-500"
  >
    <div className="relative bg-white dark:bg-dark-900 rounded-[23px] px-8 py-6 flex items-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
        <Sparkles className="w-7 h-7 text-brand-primary relative z-10" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-tr from-brand-neon/20 to-transparent"
        />
      </div>
      <div className="flex-1">
        <p className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-2">Neural Interpretation</p>
        <p className="text-lg text-slate-600 dark:text-slate-100 font-bold leading-relaxed">"{interpretation}"</p>
      </div>
      <button onClick={onClear} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors">
        <X className="w-6 h-6 text-slate-400" />
      </button>
    </div>
  </motion.div>
);

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    section: searchParams.get('section') || '',
    category: searchParams.get('category') || '',
    subcategory: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
  });
  const [aiResult, setAiResult] = useState<{ products: any[]; interpretation: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(localSearch, 350);
  const [sortField, sortOrder] = sort.split(':');

  useEffect(() => {
    const q = searchParams.get('ai');
    if (q) {
      setAiLoading(true);
      aiAPI.smartSearch(q)
        .then((r) => { setAiResult(r.data.data); })
        .catch(() => setAiResult(null))
        .finally(() => setAiLoading(false));
    } else {
      setAiResult(null);
    }
  }, [searchParams.get('ai')]);

  const { data: catData } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => storeCategoryAPI.getAll().then((r) => r.data.data),
  });
  const categories: any[] = catData?.data || catData || [];

  const { data, isLoading, isFetching } = useQuery<any>({
    queryKey: ['products', filters, sort, page, debouncedSearch],
    queryFn: () => productAPI.getProducts({
      storeSection: filters.section || undefined,
      category: filters.subcategory || filters.category || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      search: debouncedSearch || undefined,
      sort: sortField, order: sortOrder, page, limit: 12,
    }).then((r) => r.data.data),
    placeholderData: (previousData: any) => previousData,
    enabled: !aiResult,
  });

  const displayProducts: Product[] = aiResult ? aiResult.products : (data?.data || data?.products || []);
  const total: number = aiResult ? aiResult.products.length : (data?.total || 0);
  const totalPages = Math.ceil(total / 12) || 1;

  const updateFilter = (f: Partial<Filters>) => { setFilters((p) => ({ ...p, ...f })); setPage(1); };

  return (
    <div className="relative pt-24 pb-20 overflow-hidden min-h-screen">
      {/* ── Dynamic Vibe Orbs ── */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{
            x: [0, 50, -20, 0],
            y: [0, -30, 40, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-brand-primary/10 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 50, -20, 0],
            scale: [1, 0.9, 1.2, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[15%] right-[10%] w-[500px] h-[500px] bg-brand-neon/5 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{
            y: [0, -100, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-primary/5 blur-[100px] rounded-full"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-10">
          <Link to="/" className="hover:text-brand-primary transition-colors">Home</Link>
          <ChevronRight size={10} className="text-slate-700" />
          <span className="text-slate-300 dark:text-white">Shop</span>
          {filters.section && (
            <>
              <ChevronRight size={10} className="text-slate-700" />
              <motion.span
                animate={{ x: [0, 2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-brand-primary"
              >
                {filters.section}
              </motion.span>
            </>
          )}
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 uppercase"
            >
              {filters.section ? filters.section : 'Collection'}
            </motion.h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold tracking-wide">
              DISCOVER <span className="text-brand-neon">{total}</span> FLOW-SYNTHESIZED ITEMS.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative group flex-1 md:w-80">
                <div className="absolute -inset-0.5 bg-brand-gradient rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                  <input
                    type="text" placeholder="Refine results..." value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold w-full outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
                  />
                </div>
             </div>

             <div className="relative hidden md:block group">
                <div className="absolute -inset-0.5 bg-brand-gradient rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-500" />
                <div className="relative">
                  <select
                    value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
                    className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-6 pr-12 text-sm font-bold appearance-none cursor-pointer outline-none hover:border-brand-primary/30 transition-all"
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
             </div>

             <motion.button
               whileTap={buttonTap}
               onClick={() => setShowMobileFilter(true)}
               className="md:hidden flex items-center justify-center p-4 bg-brand-primary/10 text-brand-primary rounded-2xl border border-brand-primary/20"
             >
               <SlidersHorizontal size={20} />
             </motion.button>
          </div>
        </div>

        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden md:block w-72 flex-shrink-0">
            <FilterSidebar filters={filters} categories={categories} onChange={updateFilter} onApplyPrice={() => setPage(1)} />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {aiResult && (
              <AIResultBanner
                interpretation={aiResult.interpretation}
                onClear={() => { setAiResult(null); setSearchParams({}); }}
              />
            )}

            {(isLoading || aiLoading) ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    className="aspect-[4/5] rounded-[32px] bg-slate-100 dark:bg-white/5"
                  />
                ))}
              </div>
            ) : displayProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-40 glass rounded-[40px] border border-dashed border-white/10"
              >
                <Package className="w-20 h-20 text-slate-600 mx-auto mb-8 opacity-20" />
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase">No items detected</h3>
                <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">The flow is empty for these parameters. Try recalibrating your search sensors.</p>
                <motion.button
                  whileTap={buttonTap}
                  onClick={() => updateFilter({ section: '', category: '', subcategory: '', minPrice: '', maxPrice: '' })}
                  className="btn-outline !rounded-2xl !text-xs !py-4 !px-8 font-black uppercase tracking-widest"
                >
                  Reset Sensors
                </motion.button>
              </motion.div>
            ) : (
              <>
                <motion.div
                  variants={staggerContainer} initial="initial" animate="animate"
                  className={`grid grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity ${isFetching && !isLoading ? 'opacity-50' : ''}`}
                >
                  {displayProducts.map((p: any) => (
                    <motion.div key={p._id} variants={staggerItem}>
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {!aiResult && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-20">
                    <motion.button
                      whileTap={buttonTap}
                      disabled={page === 1} onClick={() => setPage(page - 1)}
                      className="w-14 h-14 rounded-2xl glass border border-white/10 flex items-center justify-center disabled:opacity-10 hover:text-brand-primary hover:border-brand-primary/30 transition-all"
                    >
                      <ChevronRight size={24} className="rotate-180" />
                    </motion.button>

                    <div className="flex items-center gap-3">
                       {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                         <motion.button
                           whileTap={buttonTap}
                           key={p} onClick={() => setPage(p)}
                           className={`w-14 h-14 rounded-2xl font-black text-sm transition-all relative overflow-hidden ${
                             page === p
                               ? 'bg-brand-primary text-black shadow-[0_0_25px_rgba(57,255,20,0.3)]'
                               : 'glass hover:bg-white/5 text-slate-500 hover:text-white border border-white/10'
                           }`}
                         >
                           <span className="relative z-10">{p}</span>
                           {page === p && (
                             <motion.div
                               layoutId="pagination-glow"
                               className="absolute inset-0 bg-white/20 blur-sm"
                             />
                           )}
                         </motion.button>
                       ))}
                    </div>

                    <motion.button
                      whileTap={buttonTap}
                      disabled={page === totalPages} onClick={() => setPage(page + 1)}
                      className="w-14 h-14 rounded-2xl glass border border-white/10 flex items-center justify-center disabled:opacity-10 hover:text-brand-primary hover:border-brand-primary/30 transition-all"
                    >
                      <ChevronRight size={24} />
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {showMobileFilter && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] md:hidden"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowMobileFilter(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-dark-900 shadow-2xl overflow-y-auto p-8 border-l border-white/5"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter">FILTERS</h3>
                <motion.button
                  whileTap={buttonTap}
                  onClick={() => setShowMobileFilter(false)}
                  className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl"
                >
                  <X size={24} />
                </motion.button>
              </div>
              <FilterSidebar filters={filters} categories={categories}
                onChange={updateFilter} onApplyPrice={() => setShowMobileFilter(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsPage;
