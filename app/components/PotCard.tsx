"use client";

import Image from "next/image";
import { Pot } from "../lib/db";

interface PotCardProps {
  pot: Pot;
  onClick?: () => void;
}

export default function PotCard({ pot, onClick }: PotCardProps) {
  const latestPhotoURL = pot.photos.at(-1)?.photoDataUrl || "/placeholder.jpg";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden rounded-lg border bg-white text-left shadow-sm transition hover:shadow-md sm:rounded-md sm:hover:-translate-y-0.5"
    >
      <div className="relative h-32 w-full bg-stone-100 sm:h-40">
        <Image
          src={latestPhotoURL}
          alt={pot.title}
          fill
          style={{ objectFit: "cover" }}
          unoptimized
        />
      </div>
      <div className="truncate p-2 text-center font-semibold text-stone-900 sm:p-3">{pot.title}</div>
    </button>
  );
}
