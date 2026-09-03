import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, Package, X, ImageOff } from 'lucide-react';
import { fetchAllProducts, fetchAllCategories, fetchAllBrands, addProduct, deleteProduct } from '../api';
import Modal from '../components/Modal';

const INPUT = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400';
const INIT = { category_id: '', brand_id: '', product_name: '', category_name: '', brand_name: '', product_description: '', product_thumbnail: '', normal_price: '', sell_price: '', total_product_count: '' };

function Field({ label, req, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}{req && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Thumbnail({ src, alt, size = 10 }) {
  const [err, setErr] = useState(false);
  const cls = `w-${size} h-${size} rounded-lg object-cover flex-shrink-0 border border-gray-100`;
  const ph = `w-${size} h-${size} rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0`;
  if (!src || err) return <div className={ph}><ImageOff size={13} className="text-gray-400" /></div>;
  return <img src={src} alt={alt} className={cls} onError={() => setErr(true)} />;
}

function StockBadge({ count }) {
  const n = Number(count);
  const cls = n > 10 ? 'bg-emerald-100 text-emerald-700' : n > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${cls}`}>{n}</span>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [submitting, setSubmitting] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c, b] = await Promise.all([fetchAllProducts(), fetchAllCategories(), fetchAllBrands()]);
      setProducts(p.data.products || []);
      setCategories(c.data.categories || []);
      setBrands(b.data.brands || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) =>
      p.product_name?.toLowerCase().includes(q) ||
      p.category_name?.toLowerCase().includes(q) ||
      p.brand_name?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const onCategoryChange = (e) => {
    const cat = categories.find((c) => c.category_id === Number(e.target.value));
    setForm((f) => ({ ...f, category_id: e.target.value, category_name: cat?.category_name || '' }));
  };

  const onBrandChange = (e) => {
    const br = brands.find((b) => b.brand_id === Number(e.target.value));
    setForm((f) => ({ ...f, brand_id: e.target.value, brand_name: br?.brand_name || '' }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.category_id || !form.brand_id || !form.product_name || !form.normal_price || !form.sell_price || !form.total_product_count) {
      toast.error('Fill in all required fields'); return;
    }
    setSubmitting(true);
    try {
      await addProduct({
        ...form,
        category_id: Number(form.category_id),
        brand_id: Number(form.brand_id),
        normal_price: Number(form.normal_price),
        sell_price: Number(form.sell_price),
        total_product_count: Number(form.total_product_count),
      });
      toast.success('Product added!');
      setShowModal(false);
      setForm(INIT);
      load();
    } catch {
      toast.error('Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      setConfirmId(null);
      setProducts((prev) => prev.filter((p) => p.product_id !== id));
    } catch {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="p-7 space-y-5 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-400 text-sm mt-0.5">{products.length} total products in database</p>
        </div>
        <button
          onClick={() => { setForm(INIT); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/30"
        >
          <Plus size={15} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
        <Search size={15} className="text-gray-400 flex-shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, category or brand…"
          className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
        />
        {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-300">
            <Package size={44} className="mx-auto mb-3" />
            <p className="text-sm">Loading products…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-300">
            <Package size={44} className="mx-auto mb-3" />
            <p className="text-sm">{search ? 'No results found' : 'No products yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  {['Product', 'Category', 'Brand', 'Normal Price', 'Sell Price', 'Stock', 'Actions'].map((h) => (
                    <th key={h} className={`px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.product_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Thumbnail src={p.product_thumbnail} alt={p.product_name} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{p.product_name}</p>
                          <p className="text-xs text-gray-400">ID #{p.product_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                        {p.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.brand_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 line-through">
                      Rs. {Number(p.normal_price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      Rs. {Number(p.sell_price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <StockBadge count={p.total_product_count} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {confirmId === p.product_id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-500">Delete?</span>
                          <button onClick={() => handleDelete(p.product_id)} className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors">Yes</button>
                          <button onClick={() => setConfirmId(null)} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmId(p.product_id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <Modal title="Add New Product" onClose={() => setShowModal(false)} size="lg">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category" req>
                <select value={form.category_id} onChange={onCategoryChange} className={INPUT} required>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Brand" req>
                <select value={form.brand_id} onChange={onBrandChange} className={INPUT} required>
                  <option value="">Select brand</option>
                  {brands.map((b) => (
                    <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Product Name" req>
              <input type="text" value={form.product_name} onChange={(e) => set('product_name', e.target.value)}
                className={INPUT} placeholder="Enter product name" required />
            </Field>

            <Field label="Description">
              <textarea value={form.product_description} onChange={(e) => set('product_description', e.target.value)}
                className={`${INPUT} resize-none`} placeholder="Product description…" rows={3} />
            </Field>

            <Field label="Thumbnail URL">
              <input type="text" value={form.product_thumbnail} onChange={(e) => set('product_thumbnail', e.target.value)}
                className={INPUT} placeholder="https://…" />
              {form.product_thumbnail && (
                <div className="mt-2">
                  <img src={form.product_thumbnail} alt="preview" className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                    onError={(e) => (e.target.style.display = 'none')} />
                </div>
              )}
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Normal Price (Rs.)" req>
                <input type="number" value={form.normal_price} onChange={(e) => set('normal_price', e.target.value)}
                  className={INPUT} placeholder="0" min="0" required />
              </Field>
              <Field label="Sell Price (Rs.)" req>
                <input type="number" value={form.sell_price} onChange={(e) => set('sell_price', e.target.value)}
                  className={INPUT} placeholder="0" min="0" required />
              </Field>
              <Field label="Stock Count" req>
                <input type="number" value={form.total_product_count} onChange={(e) => set('total_product_count', e.target.value)}
                  className={INPUT} placeholder="0" min="0" required />
              </Field>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                {submitting ? 'Adding…' : 'Add Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
