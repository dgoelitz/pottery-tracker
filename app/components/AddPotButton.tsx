"use client";

import { useState } from "react";
import { addPot, Pot, PotPhoto } from "../lib/db";
import { categories } from "../data/categories";

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
          const buffer = await file.arrayBuffer();
          const blob = new Blob([buffer], { type: file.type });

          photos.push({
            stepId: 1,
            photo: blob,
            createdAt: Date.now(),
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
      };

      await addPot(newPot);
      onPotAdded?.(newPot);

      alert(`Pot "${title}" added!`);
    } catch (error) {
      console.error("Error adding pot:", error);
      alert("Something went wrong while adding the pot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddPot}
      disabled={loading}
      className="fixed bottom-6 right-6 bg-red-500 text-white p-4 rounded-full shadow-lg text-2xl hover:bg-red-600 disabled:opacity-60"
    >
      {loading ? "…" : "+"}
    </button>
  );
}
