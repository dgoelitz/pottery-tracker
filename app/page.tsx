"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AddPotButton from "./components/AddPotButton";
import CategoryCard from "./components/CategoryCard";
import Header from "./components/Header";
import { categories } from "./data/categories";
import {
  getAllPots,
  getLegacyImportStatus,
  importMissingLegacyPots,
  LegacyImportStatus,
  Pot,
} from "./lib/db";

export default function HomePage() {
  const router = useRouter();
  const [pots, setPots] = useState<Pot[]>([]);
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [legacyStatus, setLegacyStatus] = useState<LegacyImportStatus>({ localCount: 0, missingCount: 0 });
  const [isImporting, setIsImporting] = useState(false);

  const handleCategoryClick = (id: number) => {
    router.push(`/category/${id}`);
  };

  const loadPots = useCallback(async () => {
    const allPots = await getAllPots();
    setLegacyStatus(await getLegacyImportStatus(allPots));
    setPots(allPots);
  }, []);

  const handleImportLocalPots = async () => {
    try {
      setIsImporting(true);
      const importedCount = await importMissingLegacyPots(pots);
      const allPots = await getAllPots();

      setPots(allPots);
      setLegacyStatus(await getLegacyImportStatus(allPots));
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

    void getAllPots().then(async (allPots) => {
      const nextLegacyStatus = await getLegacyImportStatus(allPots);
      if (!isMounted) return;

      setLegacyStatus(nextLegacyStatus);
      setPots(allPots);
    });

    return () => {
      isMounted = false;
    };
  }, []);

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
          {categories.map((category) => {
            const count = pots.filter((pot) => pot.categoryId === category.id).length;

            return (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={handleCategoryClick}
                count={count}
              />
            );
          })}
        </div>
      </main>

      <AddPotButton onPotAdded={loadPots} />
    </div>
  );
}
