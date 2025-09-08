"use client";

import { Pot } from "./../lib/db";

interface PotCardProps {
  pot: Pot;
  onClick?: () => void;
}

export default function PotCard({ pot, onClick }: PotCardProps) {
    const latestPhoto = pot.photos.length > 0
        ? pot.photos[pot.photos.length - 1].photo
        : "/placeholder.jpg";

    return (
        <div
            onClick={onClick}
            className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md"
        >
            <img src={latestPhoto} alt={pot.title} className="w-full h-32 object-cover" />
            <div className="p-2 text-center font-semibold">{pot.title}</div>
        </div>
    );
}
