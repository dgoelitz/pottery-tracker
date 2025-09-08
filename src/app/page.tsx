"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllPots, Pot } from "./lib/db";
import { categories } from "./data/categories";
import CategoryCard from "./components/CategoryCard";
import AddPotButton from "./components/AddPotButton";
import Header from "./components/Header";

export default function HomePage() {
  const router = useRouter();
  const [pots, setPots] = useState<Pot[]>([]);

  const handleCategoryClick = (id: number) => {
    router.push(`/category/${id}`);
  };

  const loadPots = async () => {
    const allPots = await getAllPots();
    setPots(allPots);
  };

  useEffect(() => {
    loadPots();
  }, []);

  return (
    <div>
      <Header title="Mud Goods" showHome={false} />

      <div className="p-4 grid grid-cols-2 gap-4">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} onClick={handleCategoryClick} />
        ))}
      </div>

      <AddPotButton onPotAdded={loadPots} />
    </div>
  );
}
