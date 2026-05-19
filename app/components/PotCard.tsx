"use client";

import { Pot } from "../lib/db";

interface PotCardProps {
  pot: Pot;
  onClick?: () => void;
  onPrefetch?: () => void;
}

export default function PotCard({ pot, onClick, onPrefetch }: PotCardProps) {
  const latestPhotoURL = pot.thumbnailDataUrl || pot.photos.at(-1)?.photoDataUrl || "/placeholder.jpg";

  return (
    <button
      type="button"
      onClick={onClick}
      onFocus={onPrefetch}
      onPointerEnter={onPrefetch}
      onTouchStart={onPrefetch}
      className="w-full overflow-hidden rounded-lg border bg-white text-left shadow-sm transition hover:shadow-md sm:rounded-md sm:hover:-translate-y-0.5"
    >
      <div className="relative h-32 w-full bg-stone-100 sm:h-40">
        {/* eslint-disable-next-line @next/next/no-img-element -- Data URL thumbnails do not benefit from Next image optimization. */}
        <img
          src={latestPhotoURL}
          alt={pot.title}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="truncate p-2 text-center font-semibold text-stone-900 sm:p-3">{pot.title}</div>
    </button>
  );
}
