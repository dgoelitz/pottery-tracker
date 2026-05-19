"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AddPotButton from "./components/AddPotButton";
import CategoryCard from "./components/CategoryCard";
import Header from "./components/Header";
import { categories } from "./data/categories";
import {
  getLegacyImportStatus,
  getPotSummary,
  importMissingLegacyPots,
  LegacyImportStatus,
  prefetchPotsByCategory,
  PotSummary,
} from "./lib/db";

let cachedPotSummary: PotSummary[] = [];
let cachedLegacyStatus: LegacyImportStatus = { localCount: 0, missingCount: 0 };

export default function HomePage() {
  const router = useRouter();
  const [potSummary, setPotSummary] = useState<PotSummary[]>(cachedPotSummary);
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [legacyStatus, setLegacyStatus] = useState<LegacyImportStatus>(cachedLegacyStatus);
  const [isImporting, setIsImporting] = useState(false);
  const categoryCounts = getCategoryCounts(potSummary);

  const handleCategoryClick = (id: number) => {
    router.push(`/category/${id}`);
  };

  const handleCategoryPrefetch = (id: number) => {
    prefetchPotsByCategory(id);
    router.prefetch(`/category/${id}`);
  };

  const loadHomeData = useCallback(async () => {
    const nextPotSummary = await getPotSummary();
    const nextLegacyStatus = await getLegacyImportStatus(nextPotSummary);

    cachedPotSummary = nextPotSummary;
    cachedLegacyStatus = nextLegacyStatus;
    setLegacyStatus(nextLegacyStatus);
    setPotSummary(nextPotSummary);
    prefetchNonEmptyCategories(nextPotSummary, router.prefetch);
  }, [router.prefetch]);

  const handleImportLocalPots = async () => {
    try {
      setIsImporting(true);
      const importedCount = await importMissingLegacyPots(potSummary);
      const nextPotSummary = await getPotSummary();
      const nextLegacyStatus = await getLegacyImportStatus(nextPotSummary);

      cachedPotSummary = nextPotSummary;
      cachedLegacyStatus = nextLegacyStatus;
      setPotSummary(nextPotSummary);
      setLegacyStatus(nextLegacyStatus);
      prefetchNonEmptyCategories(nextPotSummary, router.prefetch);
      setSyncMessage(
        importedCount > 0
          ? `Imported ${importedCount} local ${importedCount === 1 ? "pot" : "pots"} into the current database.`
          : "No missing local pots needed to be imported.",
      );
    } catch (error) {
      console.error("Local pot import failed:", error);
      setSyncMessage("Local pots could not be imported. Check the console for details.");
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    void getPotSummary().then(async (nextPotSummary) => {
      const nextLegacyStatus = await getLegacyImportStatus(nextPotSummary);
      if (!isMounted) return;

      cachedPotSummary = nextPotSummary;
      cachedLegacyStatus = nextLegacyStatus;
      setLegacyStatus(nextLegacyStatus);
      setPotSummary(nextPotSummary);
      prefetchNonEmptyCategories(nextPotSummary, router.prefetch);
    });

    return () => {
      isMounted = false;
    };
  }, [router.prefetch]);

  return (
    <div>
      <Header title="Mud Goods" showHome={false} />

      <main className="p-4 sm:mx-auto sm:max-w-6xl sm:px-8 sm:py-6">
        {syncMessage && (
          <p className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
            {syncMessage}
          </p>
        )}

        {legacyStatus.missingCount > 0 && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
            <p>
              This browser still has {legacyStatus.missingCount} local{" "}
              {legacyStatus.missingCount === 1 ? "pot" : "pots"} that are not in the current database.
            </p>
            <button
              type="button"
              onClick={handleImportLocalPots}
              disabled={isImporting}
              className="mt-3 rounded-md bg-amber-900 px-3 py-2 font-semibold text-white disabled:opacity-60"
            >
              {isImporting ? "Importing..." : "Import local pots"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={handleCategoryClick}
              onPrefetch={handleCategoryPrefetch}
              count={categoryCounts.get(category.id) || 0}
            />
          ))}
        </div>
      </main>

      <AddPotButton onPotAdded={loadHomeData} />
    </div>
  );
}

function getCategoryCounts(potSummary: PotSummary[]): Map<number, number> {
  const counts = new Map<number, number>();

  for (const pot of potSummary) {
    counts.set(pot.categoryId, (counts.get(pot.categoryId) || 0) + 1);
  }

  return counts;
}

function prefetchNonEmptyCategories(potSummary: PotSummary[], prefetchRoute: (href: string) => void): void {
  const counts = getCategoryCounts(potSummary);
  const categoriesWithPots = categories
    .map((category) => ({ category, count: counts.get(category.id) || 0 }))
    .filter(({ count }) => count > 0)
    .sort((left, right) => right.count - left.count);

  for (const { category } of categoriesWithPots) {
    prefetchPotsByCategory(category.id);
    prefetchRoute(`/category/${category.id}`);
  }
}
