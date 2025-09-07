"use client";

import { useRouter } from "next/navigation";
import CategoryCard from "./components/CategoryCard";
import AddPotButton from "./components/AddPotButton";

const categories = [
  { id: 1, name: "Thrown", icon: "🏺" },
  { id: 2, name: "Trimmed", icon: "✂️" },
  { id: 3, name: "Decorated", icon: "🛠️" },
  { id: 4, name: "Sanded", icon: "🪵" },
  { id: 5, name: "Painted", icon: "🖌️" },
  { id: 6, name: "Bisque Fired", icon: "🔥" },
  { id: 7, name: "Wet Sanded", icon: "💧🪵" },
  { id: 8, name: "Glazed", icon: "✨" },
  { id: 9, name: "Glaze Fired", icon: "🔥✨" },
  { id: 10, name: "Tested", icon: "🧪" },
  { id: 11, name: "Finished", icon: "✅" },
  { id: 12, name: "Sold", icon: "💰" },
  { id: 13, name: "Broken", icon: "💔" },
];

export default function HomePage() {
  const router = useRouter();

  const handleCategoryClick = (id: number) => {
    router.push(`/category/${id}`);
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {categories.map(cat => (
          <CategoryCard key={cat.id} category={cat} onClick={handleCategoryClick} />
        ))}
      </div>
      <AddPotButton />
    </div>
  );
}
