export type SnapshotValue = unknown;

export interface MockDataSnapshot {
  key: string | null;
  val: () => SnapshotValue;
  exists: () => boolean;
  child: (key: string) => MockDataSnapshot;
  forEach: (callback: (snapshot: MockDataSnapshot) => unknown) => boolean;
}

const isRecord = (value: SnapshotValue): value is Record<string, SnapshotValue> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const createSnapshot = (
  value: SnapshotValue,
  key: string | null = null
): MockDataSnapshot => {
  const snapshot: MockDataSnapshot = {
    key,
    val: () => value,
    exists: () => {
      if (value === null || value === undefined) {
        return false;
      }
      if (isRecord(value)) {
        return Object.keys(value).length > 0;
      }
      return true;
    },
    child: (childKey: string) => {
      if (!isRecord(value) || !(childKey in value)) {
        return createSnapshot(null, childKey);
      }
      return createSnapshot(value[childKey], childKey);
    },
    forEach: (callback) => {
      if (!isRecord(value)) {
        return false;
      }
      for (const [childKey, childValue] of Object.entries(value)) {
        const result = callback(createSnapshot(childValue, childKey));
        if (result === true) {
          return true;
        }
      }
      return false;
    },
  };

  return snapshot;
};
