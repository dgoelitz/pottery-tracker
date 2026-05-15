"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { categories } from "../data/categories";
import { addPot, fileToPhotoDataUrl, Pot, PotPhoto } from "../lib/db";

type AddPotButtonProps = {
  onPotAdded?: (pot: Pot) => void;
};

export default function AddPotButton({ onPotAdded }: AddPotButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleAddPot = async () => {
    try {
      setLoading(true);

      const doesWantPhoto = window.confirm("Adding photo. Cancel to add with title only.");
      const photos: PotPhoto[] = [];

      if (doesWantPhoto) {
        const file = await new Promise<File | null>((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = () => {
            const selectedFile = input.files?.[0] || null;
            resolve(selectedFile);
            document.body.removeChild(input);
          };
          document.body.appendChild(input);
          input.click();
        });

        if (file) {
          photos.push({
            stepId: 1,
            photoDataUrl: await fileToPhotoDataUrl(file),
            createdAt: Date.now(),
            contentType: file.type,
          });
        }
      }

      const title = prompt("Enter a name for the new pot:");
      if (!title) {
        setLoading(false);
        return;
      }

      const newPot: Pot = {
        id: Date.now(),
        title,
        categoryId: categories[0].id,
        photos,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const savedPot = await addPot(newPot);
      onPotAdded?.(savedPot);

      alert(`Pot "${title}" added!`);
    } catch (error) {
      console.error("Error adding pot:", error);
      alert(error instanceof Error ? error.message : "Something went wrong while adding the pot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddPot}
      disabled={loading}
      className="fixed bottom-6 right-6 grid h-14 w-14 place-items-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 disabled:opacity-60 sm:bottom-8 sm:right-8 2xl:right-[calc((100vw-72rem)/2+2rem)]"
      aria-label="Add pot"
    >
      {loading ? "..." : <Plus className="h-7 w-7" aria-hidden="true" />}
    </button>
  );
}
