"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Header from "../../components/Header";
import PotCard from "../../components/PotCard";
import { categories } from "../../data/categories";
import { getPotsByCategory, Pot } from "../../lib/db";

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const categoryId = Number(unwrappedParams.id);
  const category = categories.find((candidate) => candidate.id === categoryId);

  const [pots, setPots] = useState<Pot[]>([]);

  useEffect(() => {
    let isMounted = true;

    void getPotsByCategory(categoryId).then((potsInCategory) => {
      if (isMounted) setPots(potsInCategory);
    });

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

  if (!category) return <p>Category not found</p>;

  return (
    <div>
      <Header title={category.name} />

      <main className="p-4 sm:mx-auto sm:max-w-6xl sm:px-8 sm:py-6">
        <p className="mb-4 text-gray-600 sm:text-lg">
          {category.icon} {category.description}
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {pots.length === 0 && (
            <p className="col-span-2 rounded-md border border-dashed border-stone-300 bg-white p-6 text-center text-gray-400 sm:col-span-3 lg:col-span-4">
              No pots yet
            </p>
          )}

          {pots.map((pot) => (
            <PotCard
              key={pot.id}
              pot={pot}
              onClick={() => router.push(`/pot/${pot.id}?returnTo=${encodeURIComponent(`/category/${categoryId}`)}`)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
