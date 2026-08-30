export default function StarRating({ rating, max = 5, size = 16, editable = false, onChange }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className="flex gap-0.5">
      {stars.map((star) => {
        const filled = star <= Math.floor(rating);
        const half = !filled && star - 0.5 <= rating;
        return (
          <span
            key={star}
            onClick={() => editable && onChange && onChange(star)}
            className={editable ? 'cursor-pointer' : ''}
            style={{ fontSize: size, color: '#FFB904', lineHeight: 1 }}
          >
            {filled ? '★' : half ? '⭐' : '☆'}
          </span>
        );
      })}
    </div>
  );
}
