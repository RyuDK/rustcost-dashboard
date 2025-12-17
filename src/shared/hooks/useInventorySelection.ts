import { useCallback, useEffect, useMemo, useState } from "react";

type UseInventorySelectionArgs<T> = {
  fetchItems: () => Promise<T[]>;
  getKey: (item: T) => string;
  getLabel?: (item: T) => string;
  initialSelectedKey?: string | null;
};

export const useInventorySelection = <T>({
  fetchItems,
  getKey,
  getLabel,
  initialSelectedKey = null,
}: UseInventorySelectionArgs<T>) => {
  const [items, setItems] = useState<T[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    initialSelectedKey
  );

  const selectedItem = useMemo(() => {
    if (!selectedKey) return null;
    return items.find((it) => getKey(it) === selectedKey) ?? null;
  }, [items, selectedKey, getKey]);

  const refreshItems = useCallback(async () => {
    const list = await fetchItems();
    setItems(list);
  }, [fetchItems]);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedKey(null);
      return;
    }
    setSelectedKey((prev) => {
      if (!prev) return getKey(items[0]);
      const exists = items.some((it) => getKey(it) === prev);
      return exists ? prev : getKey(items[0]);
    });
  }, [items, getKey]);

  const pickByLabel = useCallback(
    (label: string) => {
      if (!getLabel) return;
      const match = items.find((it) => getLabel(it) === label);
      if (match) setSelectedKey(getKey(match));
    },
    [items, getKey, getLabel]
  );

  return useMemo(
    () => ({
      items,
      selectedKey,
      selectedItem,
      setSelectedKey,
      pickByLabel,
      refreshItems,
    }),
    [
      items,
      selectedKey,
      selectedItem,
      setSelectedKey,
      pickByLabel,
      refreshItems,
    ]
  );
};
