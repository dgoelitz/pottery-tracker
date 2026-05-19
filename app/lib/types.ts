export interface PotPhoto {
  stepId: number;
  photoDataUrl: string;
  createdAt: number;
  contentType?: string;
}

export interface Pot {
  id: number;
  title: string;
  categoryId: number;
  photos: PotPhoto[];
  thumbnailDataUrl?: string;
  createdAt: number;
  updatedAt: number;
}
