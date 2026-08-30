import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllCategories } from '../api';
import LoadingSpinner, { SkeletonCard } from '../components/LoadingSpinner';

export default function AllCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllCategories()
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="skeleton h-8 w-48 mb-6 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-primary mb-6">All Categories</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Link key={cat.category_id} to={`/categories/${cat.category_id}`}
            className="relative overflow-hidden rounded-xl group cursor-pointer h-40 block">
            <img
              src={cat.category_thumbnail}
              alt={cat.category_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.target.src = `https://via.placeholder.com/200x160?text=${cat.category_name}`; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white font-bold">{cat.category_name}</p>
              {cat.category_description && (
                <p className="text-white/70 text-xs line-clamp-1">{cat.category_description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
