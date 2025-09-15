"use client";

interface CategoryCardProps {
  category: { id: number; name: string; icon: string };
  onClick: (id: number) => void;
  count?: number;
}

export default function CategoryCard({ category, onClick, count = 0 }: CategoryCardProps) {
  return (
    <div
      onClick={() => onClick(category.id)}
      className="relative cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center hover:shadow-md"
    >
         {count > 0 && (
        <span className="absolute top-2 right-2 bg-green-700 text-white text-xs font-bold px-2 py-1 rounded-full">
          {count}
        </span>
      )}

      <span className="text-2xl">{category.icon}</span>
      <h3 className="mt-2 text-center font-semibold">{category.name}</h3>
    </div>
  );
}
