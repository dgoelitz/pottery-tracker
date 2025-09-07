"use client";

interface CategoryCardProps {
  category: { id: number; name: string; icon: string };
  onClick: (id: number) => void;
}

export default function CategoryCard({ category, onClick }: CategoryCardProps) {
  return (
    <div
      onClick={() => onClick(category.id)}
      className="cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center hover:shadow-md"
    >
      <span className="text-2xl">{category.icon}</span>
      <h3 className="mt-2 text-center font-semibold">{category.name}</h3>
    </div>
  );
}
