"use client";

interface CategoryCardProps {
  category: { id: number; name: string; icon: string };
  onClick: (id: number) => void;
  onPrefetch?: (id: number) => void;
  count?: number;
}

export default function CategoryCard({ category, onClick, onPrefetch, count = 0 }: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(category.id)}
      onFocus={() => onPrefetch?.(category.id)}
      onPointerEnter={() => onPrefetch?.(category.id)}
      onTouchStart={() => onPrefetch?.(category.id)}
      className="relative flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md sm:min-h-32 sm:items-start sm:justify-between sm:rounded-md sm:p-5 sm:text-left sm:hover:-translate-y-0.5"
    >
      {count > 0 && (
        <span className="absolute right-2 top-2 rounded-full bg-green-700 px-2 py-1 text-xs font-bold text-white">
          {count}
        </span>
      )}

      <span className="text-2xl sm:text-3xl">{category.icon}</span>
      <h3 className="mt-2 text-center font-semibold text-stone-900 sm:text-left">{category.name}</h3>
    </button>
  );
}
