import { useState } from 'react';
import { Ruler, ChevronDown, ChevronUp, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { getSizeAdvice } from '../api/aiApi';

const CONFIDENCE_CONFIG = {
  high:   { color: 'text-green-700  bg-green-50  border-green-200',  dot: 'bg-green-500',  label: 'High confidence'   },
  medium: { color: 'text-amber-700  bg-amber-50  border-amber-200',  dot: 'bg-amber-400',  label: 'Medium confidence' },
  low:    { color: 'text-red-700    bg-red-50    border-red-200',    dot: 'bg-red-400',    label: 'Low confidence'    },
};

const TREND_CONFIG = {
  runs_small:        { label: 'Runs Small',     bar: 'w-1/4',    color: 'bg-red-400',   tip: 'Consider sizing up'        },
  true_to_size:      { label: 'True to Size',   bar: 'w-1/2',    color: 'bg-green-500', tip: 'Stick to your usual size'  },
  runs_large:        { label: 'Runs Large',     bar: 'w-3/4',    color: 'bg-amber-400', tip: 'Consider sizing down'       },
  insufficient_data: { label: 'No data yet',    bar: 'w-1/2',    color: 'bg-gray-300',  tip: 'Based on general sizing'   },
};

const GENDER_OPTIONS = [
  { value: 'unspecified', label: 'Unspecified' },
  { value: 'male',        label: 'Male'        },
  { value: 'female',      label: 'Female'      },
];

const DEFAULT_FORM = { height_cm: '', weight_kg: '', usual_size: '', gender: 'unspecified' };

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white";

export default function SizeAdvisor({ productId }) {
  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const valid = form.height_cm >= 100 && form.height_cm <= 250
    && form.weight_kg >= 30 && form.weight_kg <= 200
    && form.usual_size.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await getSizeAdvice(productId, {
        height_cm:  Number(form.height_cm),
        weight_kg:  Number(form.weight_kg),
        usual_size: form.usual_size.trim(),
        gender:     form.gender,
      });
      setResult(res.data);
    } catch {
      setError('Could not get a recommendation right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setForm(DEFAULT_FORM); setError(''); };

  const conf  = result ? CONFIDENCE_CONFIG[result.confidence]  || CONFIDENCE_CONFIG.low   : null;
  const trend = result ? TREND_CONFIG[result.sizing_trend]      || TREND_CONFIG.insufficient_data : null;

  return (
    <div className="rounded-2xl border border-primary/15 overflow-hidden">
      {/* Toggle button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) { setResult(null); setError(''); } }}
        className="w-full flex items-center justify-between px-4 py-3 bg-primary4/40 hover:bg-primary4/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Ruler size={15} className="text-primary" />
          <span className="text-sm font-bold text-primary">Find My Size</span>
          <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">AI</span>
        </div>
        {open ? <ChevronUp size={15} className="text-primary" /> : <ChevronDown size={15} className="text-primary" />}
      </button>

      {open && (
        <div className="p-4 bg-white">
          {!result ? (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Gender">
                  <select value={form.gender} onChange={e => onChange('gender', e.target.value)} className={inputCls}>
                    {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Usual Size (S/M/L/38…)">
                  <input
                    type="text"
                    placeholder="e.g. M, L, 38"
                    value={form.usual_size}
                    onChange={e => onChange('usual_size', e.target.value)}
                    className={inputCls}
                    maxLength={10}
                  />
                </Field>
                <Field label="Height (cm)">
                  <input
                    type="number"
                    placeholder="170"
                    min={100} max={250}
                    value={form.height_cm}
                    onChange={e => onChange('height_cm', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Weight (kg)">
                  <input
                    type="number"
                    placeholder="65"
                    min={30} max={200}
                    value={form.weight_kg}
                    onChange={e => onChange('weight_kg', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              {error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!valid || loading}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary1 disabled:opacity-40 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Analysing…</>
                  : <><Ruler size={15} /> Get My Size</>
                }
              </button>
            </form>
          ) : (
            /* ── Result ── */
            <div className="space-y-3">
              {/* Recommended size + confidence */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center w-20 h-20 bg-primary rounded-2xl flex-shrink-0 shadow-sm">
                  <span className="text-3xl font-black text-white leading-none">{result.recommended_size}</span>
                  <span className="text-[10px] text-white/70 mt-0.5 font-medium">Your size</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${conf.color}`}>
                    <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                    {conf.label}
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{result.fit_note}</p>
                </div>
              </div>

              {/* Sizing trend bar */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Community sizing</span>
                  <span className="text-[11px] font-bold text-gray-700">{trend.label}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${trend.color} ${trend.bar}`} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">Smaller</span>
                  <span className="text-[10px] text-amber-600 font-medium">{trend.tip}</span>
                  <span className="text-[10px] text-gray-400">Larger</span>
                </div>
              </div>

              {/* Community says */}
              {result.community_says && (
                <div className="flex gap-2 items-start bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                  <Info size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">{result.community_says}</p>
                </div>
              )}

              {result.sizing_review_count > 0 && (
                <p className="text-[10px] text-gray-400 text-center">
                  Based on {result.sizing_review_count} sizing review{result.sizing_review_count !== 1 ? 's' : ''}
                </p>
              )}

              <button
                onClick={reset}
                className="w-full text-xs text-primary hover:text-primary1 font-semibold py-2 border border-primary/20 hover:border-primary rounded-xl transition-colors"
              >
                Try different measurements
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
