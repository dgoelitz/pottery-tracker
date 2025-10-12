import { openDB } from "idb";

export interface PotPhoto {
    stepId: number;
    photo: Blob;
    createdAt: number;
}

export interface Pot {
    id: number;
    title: string;
    categoryId: number;
    photos: PotPhoto[];
    createdAt: number;
}

const DB_NAME = "potteryDB";
const DB_VERSION = 1;
const STORE_NAME = "pots";

export async function getDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        },
    });
}

export async function getAllPots(): Promise<Pot[]> {
    const db = await getDB();
    return db.getAll(STORE_NAME);
}

export async function getPotsByCategory(categoryId: number): Promise<Pot[]> {
    const db = await getDB();
    const all = await db.getAll(STORE_NAME);
    return all.filter((p) => p.categoryId === categoryId);
}

export async function getPotById(id: number): Promise<Pot | undefined> {
    const db = await getDB();
    return db.get(STORE_NAME, id);
}

export async function addPot(pot: Pot) {
    const db = await getDB();
    await db.put(STORE_NAME, pot);
}

export async function deletePot(id: number) {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
}

export async function updatePotCategory(potId: number, newCategoryId: number): Promise<void> {
    const db = await getDB();
    const pot = await db.get(STORE_NAME, potId);
    if (!pot) return;

    const updatedPot = { ...pot, categoryId: newCategoryId };
    await db.put(STORE_NAME, updatedPot);
}

export async function updatePotTitle(potId: number, newTitle: string): Promise<void> {
    const db = await getDB();
    const pot = await db.get(STORE_NAME, potId);
    if (!pot) return;

    const updatedPot = { ...pot, title: newTitle };
    await db.put(STORE_NAME, updatedPot);
}

export async function addPhotoToPot(potId: number, photoBlob: Blob): Promise<void> {
    const db = await getDB();
    const pot = await db.get(STORE_NAME, potId);
    if (!pot) return;

    const nextStepId =
        pot.photos.length > 0
            ? Math.max(...pot.photos.map((p: { stepId: number }) => p.stepId)) + 1
            : 1;

    pot.photos.push({
        stepId: nextStepId,
        photo: photoBlob,
        createdAt: Date.now(),
    });

    await db.put(STORE_NAME, pot);
}
