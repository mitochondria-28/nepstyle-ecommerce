import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, Building2, X, ImageOff } from 'lucide-react';
import { fetchAllBrands, addBrand, deleteBrand } from '../api';
import Modal from '../components/Modal';

const INPUT = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400';
const INIT = { brand_name: '', brand_thumbnail: '', brand_description: '' };

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

function Thumbnail({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <ImageOff size={13} className="text-gray-400" />
      </div>
    );
  }
  return <img src={src} alt={alt} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" onError={() => setErr(true)} />;
}

export default function BrandsPage() {
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
      const res = await fetchAllBrands();
      setBrands(res.data.brands || []);
    } catch {
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return brands;
    const q = search.toLowerCase();
    return brands.filter((b) =>
      b.brand_name?.toLowerCase().includes(q) ||
      b.brand_description?.toLowerCase().includes(q)
    );
  }, [brands, search]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.brand_name.trim()) { toast.error('Brand name is required'); return; }
    setSubmitting(true);
    try {
      await addBrand(form);
      toast.success('Brand added!');
      setShowModal(false);
      setForm(INIT);
      load();
    } catch {
      toast.error('Failed to add brand');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBrand(id);
      toast.success('Brand deleted');
      setConfirmId(null);
      setBrands((prev) => prev.filter((b) => b.brand_id !== id));
    } catch {
      toast.error('Failed to delete brand');
    }
  };

  return (
    <div className="p-7 space-y-5 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-400 text-sm mt-0.5">{brands.length} total brands</p>
        </div>
        <button
          onClick={() => { setForm(INIT); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/30"
        >
          <Plus size={15} />
          Add Brand
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
        <Search size={15} className="text-gray-400 flex-shrink-0" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brands…"
          className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400" />
        {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-300">
            <Building2 size={44} className="mx-auto mb-3" />
            <p className="text-sm">Loading brands…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-300">
            <Building2 size={44} className="mx-auto mb-3" />
            <p className="text-sm">{search ? 'No results found' : 'No brands yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Brand</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="text-right px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((brand) => (
                  <tr key={brand.brand_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Thumbnail src={brand.brand_thumbnail} alt={brand.brand_name} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{brand.brand_name}</p>
                          <p className="text-xs text-gray-400">ID #{brand.brand_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <p className="line-clamp-2">{brand.brand_description || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {confirmId === brand.brand_id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-500">Delete?</span>
                          <button onClick={() => handleDelete(brand.brand_id)} className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600">Yes</button>
                          <button onClick={() => setConfirmId(null)} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmId(brand.brand_id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
        <Modal title="Add New Brand" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <Field label="Brand Name" req>
              <input type="text" value={form.brand_name} onChange={(e) => set('brand_name', e.target.value)}
                className={INPUT} placeholder="e.g. Nike" required />
            </Field>
            <Field label="Thumbnail URL">
              <input type="text" value={form.brand_thumbnail} onChange={(e) => set('brand_thumbnail', e.target.value)}
                className={INPUT} placeholder="https://…" />
              {form.brand_thumbnail && (
                <img src={form.brand_thumbnail} alt="preview" className="mt-2 w-14 h-14 rounded-lg object-cover border border-gray-200"
                  onError={(e) => (e.target.style.display = 'none')} />
              )}
            </Field>
            <Field label="Description">
              <textarea value={form.brand_description} onChange={(e) => set('brand_description', e.target.value)}
                className={`${INPUT} resize-none`} placeholder="Brand description…" rows={3} />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                {submitting ? 'Adding…' : 'Add Brand'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
