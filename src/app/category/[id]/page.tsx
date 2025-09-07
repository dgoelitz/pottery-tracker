"use client";

import { useRouter } from "next/navigation";
import PotCard from "./../../components/PotCard";

const samplePots = [
  { id: 1, title: "Blue Vase", photo: "/sample1.jpg" },
  { id: 2, title: "Green Bowl", photo: "/sample2.jpg" },
];

export default function CategoryPage({ params }: { params: { id: string } }) {
  const categoryId = params.id;
  const router = useRouter();

  const categoryName = "Category " + categoryId;
  const categoryDescription = "Description of this category";

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{categoryName}</h1>
      <p className="mb-4">{categoryDescription}</p>

      <div className="grid grid-cols-2 gap-4">
        {samplePots.map((pot) => (
          <PotCard key={pot.id} pot={pot} onClick={() => alert("Open pot detail")} />
        ))}
      </div>
    </div>
  );
}
