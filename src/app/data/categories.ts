export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export const categories: Category[] = [
  { id: 1, name: "Thrown", description: "Clay has been shaped on the wheel", icon: "🏺" },
  { id: 2, name: "Trimmed", description: "Trimmed excess clay and refined shape", icon: "✂️" },
  { id: 3, name: "Decorated", description: "Added handles or other decorations", icon: "🛠️" },
  { id: 4, name: "Sanded", description: "Sanded for the first time as greenware", icon: "🪵" },
  { id: 5, name: "Painted", description: "Applied colors or underglaze", icon: "🖌️" },
  { id: 6, name: "Bisque Firing", description: "Away at the kiln for first firing", icon: "🏭🔥" },
  { id: 7, name: "Bisque Fired", description: "Back from the kiln for first firing", icon: "🎉🔥" },
  { id: 8, name: "Wet Sanded", description: "Sanded after initial bisque firing", icon: "💧🪵" },
  { id: 9, name: "Glazed", description: "Applied glaze", icon: "🎨" },
  { id: 10, name: "Glaze Firing", description: "Away at the kiln for second firing", icon: "🏭✨" },
  { id: 11, name: "Glaze Fired", description: "Back from the kiln for second firing", icon: "🎉✨" },
  { id: 12, name: "Tested", description: "Passed thermal shock and leak tests", icon: "🧪" },
  { id: 13, name: "Finished", description: "Complete and ready to be sold", icon: "✅" },
  { id: 14, name: "Sold", description: "Pottery that has been purchased", icon: "💰" },
  { id: 15, name: "Broken", description: "Pottery that was damaged or discarded or any pot that has been deleted", icon: "💔" },
];
