/**
 * バッチ処理ユーティリティ
 */
import { getDb, COLLECTIONS } from '@vault-share/db';
import type { Firestore } from '@vault-share/db';

export interface BatchProcessorConfig<T> {
  batchSize?: number; // デフォルト: 500（Firestoreの制限）
  onProgress?: (current: number, total: number) => void;
  onError?: (error: Error, item: T) => void;
}

/**
 * アイテムをバッチで処理する
 */
export async function processBatch<T>(
  items: T[],
  processor: (batch: Firestore['batch'], item: T, index: number) => void,
  config: BatchProcessorConfig<T> = {}
): Promise<void> {
  const { batchSize = 500, onProgress, onError } = config;
  const db = getDb();
  const total = items.length;
  let processed = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = db.batch();
    const chunk = items.slice(i, i + batchSize);

    for (let j = 0; j < chunk.length; j++) {
      const item = chunk[j];
      try {
        processor(batch, item, i + j);
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)), item);
        } else {
          throw error;
        }
      }
    }

    await batch.commit();
    processed += chunk.length;

    if (onProgress) {
      onProgress(processed, total);
    }
  }
}

/**
 * アイテムをバッチで作成する
 */
export async function createBatch<T extends { id?: string }>(
  items: T[],
  collection: string,
  getId: (item: T, index: number) => string,
  transform: (item: T) => Omit<T, 'id'>,
  config: BatchProcessorConfig<T> = {}
): Promise<string[]> {
  const createdIds: string[] = [];
  const db = getDb();

  await processBatch(
    items,
    (batch, item, index) => {
      const id = getId(item, index);
      const docRef = db.collection(collection).doc(id);
      const transformed = transform(item);
      batch.set(docRef, transformed);
      createdIds.push(id);
    },
    config
  );

  return createdIds;
}
