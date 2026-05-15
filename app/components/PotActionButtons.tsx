"use client";

import { ArrowDown, ArrowUp, Camera, HeartCrack, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { categories } from "../data/categories";
import { addPhotoToPot, deletePot, fileToPhotoDataUrl, Pot, updatePotCategory } from "../lib/db";

interface PotActionButtonsProps {
  pot: Pot;
  setPot: React.Dispatch<React.SetStateAction<Pot | null>>;
  reloadPot: () => Promise<void>;
}

const actionButtonClass =
  "flex h-20 items-center justify-center gap-1 rounded px-3 py-2 text-sm font-semibold text-white transition disabled:opacity-60 sm:w-full";

export default function PotActionButtons({ pot, setPot, reloadPot }: PotActionButtonsProps) {
  const router = useRouter();
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const category = categories.find((candidate) => candidate.id === pot.categoryId);
  const nextCategory = category ? categories.find((candidate) => candidate.id === category.id + 1) : null;
  const prevCategory = category ? categories.find((candidate) => candidate.id === category.id - 1) : null;

  const canUpgrade = category && category.name !== "Shipped" && category.name !== "Broken";
  const canDowngrade = category && category.name !== "Thrown" && category.name !== "Broken";
  const isBroken = category && category.name === "Broken";

  const handleUpgrade = async () => {
    if (!category || !nextCategory) return;
    await runAction(async () => {
      const updated = await updatePotCategory(pot.id, nextCategory.id);
      setPot(updated || { ...pot, categoryId: nextCategory.id });
    });
  };

  const handleDowngrade = async () => {
    if (!category || !prevCategory) return;
    await runAction(async () => {
      const updated = await updatePotCategory(pot.id, prevCategory.id);
      setPot(updated || { ...pot, categoryId: prevCategory.id });
    });
  };

  const handleMarkBroken = async () => {
    const brokenCat = categories.find((candidate) => candidate.name === "Broken");
    if (!brokenCat) return;
    await runAction(async () => {
      const updated = await updatePotCategory(pot.id, brokenCat.id);
      setPot(updated || { ...pot, categoryId: brokenCat.id });
    });
  };

  const handleUndoBroken = async () => {
    const thrownCat = categories.find((candidate) => candidate.name === "Thrown");
    if (!thrownCat) return;
    await runAction(async () => {
      const updated = await updatePotCategory(pot.id, thrownCat.id);
      setPot(updated || { ...pot, categoryId: thrownCat.id });
    });
  };

  const handleDeletePermanent = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this pot permanently?");
    if (!confirmed) return;
    await runAction(async () => {
      await deletePot(pot.id);
      router.push("/");
    });
  };

  const handleAttachPhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        await runAction(async () => {
          await addPhotoToPot(pot.id, await fileToPhotoDataUrl(file));
          await reloadPot();
        });
      }
    };
    input.click();
  };

  const runAction = async (action: () => Promise<void>) => {
    try {
      setIsWorking(true);
      setErrorMessage("");
      await action();
    } catch (error) {
      console.error("Pot action failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="mb-4">
      {errorMessage && (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {errorMessage}
        </p>
      )}

      <div className="flex justify-between gap-2 sm:grid sm:grid-cols-2">
        <div className="flex w-1/2 gap-2 sm:contents">
          {isBroken && (
            <button
              type="button"
              onClick={handleUndoBroken}
              disabled={isWorking}
              className={`${actionButtonClass} w-full bg-yellow-500 hover:bg-yellow-600`}
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              <span>Undo Discard</span>
            </button>
          )}

          {!isBroken && canDowngrade && prevCategory && (
            <button
              type="button"
              onClick={handleDowngrade}
              disabled={isWorking}
              className={`${actionButtonClass} w-1/2 bg-blue-500 hover:bg-blue-600`}
            >
              <ArrowDown className="h-5 w-5" aria-hidden="true" />
              <span>{prevCategory.name}</span>
            </button>
          )}

          {!isBroken && (
            <button
              type="button"
              onClick={handleMarkBroken}
              disabled={isWorking}
              className={`${actionButtonClass} w-1/2 bg-purple-600 hover:bg-purple-700`}
            >
              <HeartCrack className="h-5 w-5" aria-hidden="true" />
              <span>Broken</span>
            </button>
          )}
        </div>

        <div className="flex w-1/2 gap-2 sm:contents">
          {!isBroken && canUpgrade && (
            <button
              type="button"
              onClick={handleAttachPhoto}
              disabled={isWorking}
              className={`${actionButtonClass} w-1/2 bg-green-600 hover:bg-green-700`}
            >
              <Camera className="h-5 w-5" aria-hidden="true" />
              <span>Add Photo</span>
            </button>
          )}

          {!isBroken && canUpgrade && nextCategory && (
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isWorking}
              className={`${actionButtonClass} w-1/2 bg-purple-600 hover:bg-purple-700`}
            >
              <ArrowUp className="h-5 w-5" aria-hidden="true" />
              <span>{nextCategory.name}</span>
            </button>
          )}

          {isBroken && (
            <button
              type="button"
              onClick={handleDeletePermanent}
              disabled={isWorking}
              className={`${actionButtonClass} w-full bg-red-600 hover:bg-red-700`}
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
