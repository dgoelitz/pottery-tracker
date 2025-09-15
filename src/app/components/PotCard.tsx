"use client";

import { useMemo, useEffect } from "react";
import { Pot } from "./../lib/db";

interface PotCardProps {
  pot: Pot;
  onClick?: () => void;
}

export default function PotCard({ pot, onClick }: PotCardProps) {
  const latestPhotoURL = useMemo(() => {
    if (pot.photos.length === 0) return "/placeholder.jpg";
    const blob = new Blob([pot.photos[pot.photos.length - 1].photo]);
    return URL.createObjectURL(blob);
  }, [pot.photos]);

  useEffect(() => {
    return () => {
      if (latestPhotoURL && latestPhotoURL !== "/placeholder.jpg") {
        URL.revokeObjectURL(latestPhotoURL);
      }
    };
  }, [latestPhotoURL]);

  return (
    <div
      onClick={onClick}
      className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md"
    >
      <img
        src={latestPhotoURL}
        alt={pot.title}
        className="w-full h-32 object-cover"
      />
      <div className="p-2 text-center font-semibold">{pot.title}</div>
    </div>
  );
}
