import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, Zap, X, ImageOff } from 'lucide-react';
import { fetchAllFlashSales, fetchAllProducts, addFlashSale, deleteFlashSale } from '../api';
import Modal from '../components/Modal';

const INPUT = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400';
const INIT = {
  product_id: '', category_id: '', brand_id: '',
  product_name: '', category_name: '', brand_name: '',
  product_description: '', product_thumbnail: '',
  normal_price: '', sell_price: '', total_product_count: '',
  discount_percentage: '', discounted_price: '',
};

function Field({ label, req, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}{req && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="ml-1 text-gray-400 font-normal normal-case tracking-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function Thumbnail({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><ImageOff size={13} className="text-gray-400" /></div>;
  }
  return <img src={src} alt={alt} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" onError={() => setErr(true)} />;
}

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INIT);
  const [submitting, setSubmitting] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [fs, p] = await Promise.all([fetchAllFlashSales(), fetchAllProducts()]);
      setFlashSales(fs.data.flash_sale_products || []);
      setProducts(p.data.products || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return flashSales;
    const q = search.toLowerCase();
    return flashSales.filter((f) =>
      f.product_name?.toLowerCase().includes(q) ||
      f.category_name?.toLowerCase().includes(q) ||
      f.brand_name?.toLowerCase().includes(q)
    );
  }, [flashSales, search]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onProductSelect = (e) => {
    const product = products.find((p) => p.product_id === Number(e.target.value));
    if (!product) { setForm((f) => ({ ...f, product_id: '' })); return; }
    setForm((f) => ({
      ...f,
      product_id: product.product_id,
      category_id: product.category_id,
      brand_id: product.brand_id,
      product_name: product.product_name,
      category_name: product.category_name,
      brand_name: product.brand_name,
      product_description: product.product_description || '',
      product_thumbnail: product.product_thumbnail || '',
      normal_price: product.normal_price,
      sell_price: product.sell_price,
      total_product_count: product.total_product_count,
      discounted_price: f.discount_percentage
        ? (Number(product.sell_price) * (1 - Number(f.discount_percentage) / 100)).toFixed(2)
        : '',
    }));
  };

  const onDiscountChange = (e) => {
    const pct = e.target.value;
    const disc = form.sell_price && pct
      ? (Number(form.sell_price) * (1 - Number(pct) / 100)).toFixed(2)
      : '';
    setForm((f) => ({ ...f, discount_percentage: pct, discounted_price: disc }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.product_id || !form.discount_percentage) {
      toast.error('Select a product and set a discount percentage'); return;
    }
    setSubmitting(true);
    try {
      await addFlashSale({
        ...form,
        product_id: Number(form.product_id),
        category_id: Number(form.category_id),
        brand_id: Number(form.brand_id),
        normal_price: Number(form.normal_price),
        sell_price: Number(form.sell_price),
        total_product_count: Number(form.total_product_count),
        discount_percentage: Number(form.discount_percentage),
        discounted_price: Number(form.discounted_price),
      });
      toast.success('Flash sale product added!');
      setShowModal(false);
      setForm(INIT);
      load();
    } catch {
      toast.error('Failed to add flash sale product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFlashSale(id);
      toast.success('Flash sale product deleted');
      setConfirmId(null);
      setFlashSales((prev) => prev.filter((f) => f.flash_sale_id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-7 space-y-5 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flash Sales</h1>
          <p className="text-gray-400 text-sm mt-0.5">{flashSales.length} active flash sale products</p>
        </div>
        <button
          onClick={() => { setForm(INIT); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-amber-500/30"
        >
          <Plus size={15} />
          Add Flash Sale
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
        <Search size={15} className="text-gray-400 flex-shrink-0" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search flash sale products…"
          className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400" />
        {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-300">
            <Zap size={44} className="mx-auto mb-3" />
            <p className="text-sm">Loading flash sales…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-300">
            <Zap size={44} className="mx-auto mb-3" />
            <p className="text-sm">{search ? 'No results found' : 'No flash sale products yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  {['Product', 'Category', 'Brand', 'Sell Price', 'Discount', 'Flash Price', 'Stock', 'Actions'].map((h) => (
                    <th key={h} className={`px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <tr key={item.flash_sale_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Thumbnail src={item.product_thumbnail} alt={item.product_name} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.product_name}</p>
                          <p className="text-xs text-gray-400">ID #{item.flash_sale_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                        {item.category_name}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{item.brand_name}</td>
                    <td className="px-5 py-4 text-sm text-gray-400 line-through">
                      Rs. {Number(item.sell_price).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold">
                        -{item.discount_percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-emerald-600">
                      Rs. {Number(item.discounted_price).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 font-medium">{item.total_product_count}</td>
                    <td className="px-5 py-4 text-right">
                      {confirmId === item.flash_sale_id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-500">Delete?</span>
                          <button onClick={() => handleDelete(item.flash_sale_id)} className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600">Yes</button>
                          <button onClick={() => setConfirmId(null)} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmId(item.flash_sale_id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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

      {showModal && (
        <Modal title="Add Flash Sale Product" onClose={() => setShowModal(false)} size="lg">
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Product selector */}
            <Field label="Select Product" req hint="auto-fills product details">
              <select value={form.product_id} onChange={onProductSelect} className={INPUT} required>
                <option value="">Choose a product…</option>
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    [{p.product_id}] {p.product_name} — Rs. {Number(p.sell_price).toLocaleString()}
                  </option>
                ))}
              </select>
            </Field>

            {form.product_id && (
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100">
                <Thumbnail src={form.product_thumbnail} alt={form.product_name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{form.product_name}</p>
                  <p className="text-xs text-gray-500">{form.category_name} · {form.brand_name}</p>
                  <p className="text-xs text-gray-500">Sell Price: Rs. {Number(form.sell_price).toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Discount %" req>
                <input type="number" value={form.discount_percentage} onChange={onDiscountChange}
                  className={INPUT} placeholder="e.g. 20" min="1" max="99" required />
              </Field>
              <Field label="Discounted Price (Rs.)" hint="auto-calculated">
                <input type="number" value={form.discounted_price}
                  onChange={(e) => set('discounted_price', e.target.value)}
                  className={`${INPUT} bg-gray-50`} placeholder="0.00" min="0" />
              </Field>
            </div>

            <Field label="Flash Sale Stock">
              <input type="number" value={form.total_product_count}
                onChange={(e) => set('total_product_count', e.target.value)}
                className={INPUT} placeholder="Stock quantity" min="1" />
            </Field>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                {submitting ? 'Adding…' : 'Add Flash Sale'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
