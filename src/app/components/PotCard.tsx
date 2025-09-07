"use client";

interface PotCardProps {
  pot: { id: number; title: string; photo: string };
  onClick?: () => void;
}

export default function PotCard({ pot, onClick }: PotCardProps) {
  return (
    <div
      onClick={onClick}
      className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md"
    >
      <img src={pot.photo} alt={pot.title} className="w-full h-32 object-cover" />
      <div className="p-2 text-center font-semibold">{pot.title}</div>
    </div>
  );
}
