"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { categories } from "./../../data/categories";
import { Pot, getPotsByCategory } from "./../../lib/db";
import PotCard from "./../../components/PotCard";
import Header from "./../../components/Header";

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const categoryId = Number(unwrappedParams.id);
  const category = categories.find((c) => c.id === categoryId);

  if (!category) return <p>Category not found</p>;

  const [pots, setPots] = useState<Pot[]>([]);

  const loadPots = async () => {
    const potsInCategory = await getPotsByCategory(categoryId);
    setPots(potsInCategory);
  };

  useEffect(() => {
    loadPots();
  }, [categoryId]);

  return (
    <div>
      <Header title={category.name} />

      <div className="p-4">
        <p className="mb-4 text-gray-600">{category.icon} {category.description}</p>

        <div className="grid grid-cols-2 gap-4">
          {pots.length === 0 && (
            <p className="col-span-2 text-gray-400">No pots yet</p>
          )}

          {pots.map((pot) => (
            <PotCard
              key={pot.id}
              pot={pot}
              onClick={() => router.push(`/pot/${pot.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
