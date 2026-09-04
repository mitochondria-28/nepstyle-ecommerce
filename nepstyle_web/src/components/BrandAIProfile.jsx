import { useEffect, useState } from 'react';
import { Sparkles, Star, Tag, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { getBrandProfile } from '../api/aiApi';

const TIER_CONFIG = {
  'Budget':    { className: 'bg-green-100  text-green-700',  label: 'Budget-Friendly' },
  'Mid-range': { className: 'bg-blue-100   text-blue-700',   label: 'Mid-Range'       },
  'Premium':   { className: 'bg-purple-100 text-purple-700', label: 'Premium'         },
};

export default function BrandAIProfile({ brandId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(true);

  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    getBrandProfile(brandId)
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [brandId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 bg-gray-200 rounded-full" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-full bg-gray-100 rounded mb-2" />
        <div className="h-4 w-3/4 bg-gray-100 rounded mb-4" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-6 w-20 bg-gray-100 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile || !profile.ai_bio) return null;

  const tier = TIER_CONFIG[profile.price_tier] || TIER_CONFIG['Mid-range'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="text-sm font-semibold text-gray-700">AI Brand Intelligence</span>
          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
            Powered by AI
          </span>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-50">
          {/* Specialty + Tier row */}
          <div className="flex flex-wrap gap-2 mt-4 mb-3">
            {profile.specialty && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <TrendingUp size={11} />
                {profile.specialty}
              </span>
            )}
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${tier.className}`}>
              {tier.label}
            </span>
            {profile.avg_rating > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full">
                <Star size={11} className="fill-yellow-500 text-yellow-500" />
                {profile.avg_rating} / 5
                <span className="text-yellow-500/70 font-normal">
                  ({profile.total_reviews} reviews)
                </span>
              </span>
            )}
          </div>

          {/* AI bio */}
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {profile.ai_bio}
          </p>

          {/* Style tags */}
          {profile.style_tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.style_tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full hover:border-primary hover:text-primary transition-colors"
                >
                  <Tag size={9} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
