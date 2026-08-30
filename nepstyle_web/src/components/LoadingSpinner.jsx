export default function LoadingSpinner({ size = 'md', fullPage = false }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const spinner = (
    <div className={`${sizes[size]} border-4 border-primary3 border-t-primary rounded-full animate-spin`} />
  );
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
        {spinner}
      </div>
    );
  }
  return (
    <div className="flex justify-center items-center py-10">
      {spinner}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <div className="skeleton h-40 w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-4 w-1/3" />
      </div>
    </div>
  );
}
