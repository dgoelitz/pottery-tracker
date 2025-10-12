"use client";

import { categories } from "../data/categories";
import { useRouter } from "next/navigation";
import { Pot, updatePotCategory, addPhotoToPot, deletePot } from "../lib/db";

interface PotActionButtonsProps {
  pot: Pot;
  setPot: React.Dispatch<React.SetStateAction<Pot | null>>;
  reloadPot: () => Promise<void>;
}

export default function PotActionButtons({ pot, setPot, reloadPot }: PotActionButtonsProps) {
  const router = useRouter();
  const category = categories.find(c => c.id === pot.categoryId);
  const nextCategory = category ? categories.find(c => c.id === category.id + 1) : null;
  const prevCategory = category ? categories.find(c => c.id === category.id - 1) : null;

  const canUpgrade = category && category.name !== "Shipped" && category.name !== "Broken";
  const canDowngrade = category && category.name !== "Thrown" && category.name !== "Broken";
  const isBroken = category && category.name === "Broken";

  const handleUpgrade = async () => {
    if (!category || !nextCategory) return;
    await updatePotCategory(pot.id, nextCategory.id);
    setPot({ ...pot, categoryId: nextCategory.id });
  };

  const handleDowngrade = async () => {
    if (!category || !prevCategory) return;
    await updatePotCategory(pot.id, prevCategory.id);
    setPot({ ...pot, categoryId: prevCategory.id });
  };

  const handleMarkBroken = async () => {
    const brokenCat = categories.find(c => c.name === "Broken");
    if (!brokenCat) return;
    await updatePotCategory(pot.id, brokenCat.id);
    setPot({ ...pot, categoryId: brokenCat.id });
  };

  const handleUndoBroken = async () => {
    const thrownCat = categories.find(c => c.name === "Thrown");
    if (!thrownCat) return;
    await updatePotCategory(pot.id, thrownCat.id);
    setPot({ ...pot, categoryId: thrownCat.id });
  };

  const handleDeletePermanent = async () => {
    const confirmed = window.confirm("⚠️ Are you sure you want to delete this pot permanently?");
    if (!confirmed) return;
    await deletePot(pot.id);
    router.push("/");
  };

  const handleAttachPhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: file.type });
        await addPhotoToPot(pot.id, blob);
        await reloadPot();
      }
    };
    input.click();
  };

  return (
    <div className="flex justify-between mb-4 gap-2">
      <div className="flex gap-2 w-1/2">
        {isBroken && (
          <button
            onClick={handleUndoBroken}
            className="w-2/2 h-20 bg-yellow-400 text-white px-4 py-2 rounded text-sm flex items-center justify-center gap-1"
          >
            <span>↩️</span>
            <span>Undo Discard</span>
          </button>
        )}
        {!isBroken && canDowngrade && prevCategory && (
          <button
            onClick={handleDowngrade}
            className="w-1/2 h-20 bg-blue-400 text-white px-4 py-2 rounded text-sm flex items-center justify-center gap-1"
          >
            <span>↓</span>
            <span>{prevCategory.name}</span>
          </button>
        )}
        {!isBroken && (
          <button
            onClick={handleMarkBroken}
            className="w-1/2 h-20 bg-purple-500 text-white px-4 py-2 rounded text-sm flex items-center justify-center gap-1"
          >
            <span>💔</span>
            <span>Broken</span>
          </button>
        )}
      </div>

      <div className="flex gap-2 w-1/2">
        {!isBroken && canUpgrade && (
          <button
            onClick={handleAttachPhoto}
            className="w-1/2 h-20 bg-green-500 text-white px-4 py-2 rounded text-sm flex items-center justify-center gap-1"
          >
            <span>📸</span>
            <span>Add Photo</span>
          </button>
        )}
        {!isBroken && canUpgrade && nextCategory && (
          <button
            onClick={handleUpgrade}
            className="w-1/2 h-20 bg-purple-500 text-white px-4 py-2 rounded text-sm flex items-center justify-center gap-1"
          >
            <span>↑</span>
            <span>{nextCategory.name}</span>
          </button>
        )}
        {isBroken && (
          <button
            onClick={handleDeletePermanent}
            className="w-2/2 h-20 bg-red-600 text-white px-4 py-2 rounded text-sm flex items-center justify-center gap-1"
          >
            <span>⚠️</span>
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
