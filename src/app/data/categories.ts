export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export const categories: Category[] = [
  { id: 1, name: "Thrown", description: "Clay has been shaped on the wheel.", icon: "🏺" },
  { id: 2, name: "Trimmed", description: "Trimmed excess clay and refined shape.", icon: "✂️" },
  { id: 3, name: "Decorated", description: "Added handles or other decorations.", icon: "🛠️" },
  { id: 4, name: "Sanded", description: "Smoothed rough surfaces with sandpaper.", icon: "🪵" },
  { id: 5, name: "Painted", description: "Applied colors or underglaze.", icon: "🖌️" },
  { id: 6, name: "Bisque Fired", description: "First kiln firing to harden the clay.", icon: "🔥" },
  { id: 7, name: "Wet Sanded", description: "Sanding after initial bisque firing for smoothness.", icon: "💧🪵" },
  { id: 8, name: "Glazed", description: "Coating pottery with glaze for color and protection.", icon: "✨" },
  { id: 9, name: "Glaze Fired", description: "Second firing to melt and set the glaze.", icon: "🔥✨" },
  { id: 10, name: "Tested", description: "Testing pottery for functionality or durability.", icon: "🧪" },
  { id: 11, name: "Finished", description: "Pot is complete and ready for use or display.", icon: "✅" },
  { id: 12, name: "Sold", description: "Pottery that has been purchased.", icon: "💰" },
  { id: 13, name: "Broken", description: "Pottery that was damaged or discarded.", icon: "💔" },
];
