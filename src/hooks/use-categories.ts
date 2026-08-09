import { useCallback, useEffect, useState } from 'react';

import type { CategoryInput } from '../lib/validation/category-schema';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../services/categories-service';
import type { Category } from '../types/category';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCategories();
        if (!active) return;
        setCategories(data);
      } catch (e) {
        if (active) setError(e as Error);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const reload = useCallback(() => setReloadToken(token => token + 1), []);

  const create = useCallback(
    async (input: CategoryInput) => {
      const category = await createCategory(input);
      reload();
      return category;
    },
    [reload],
  );

  const update = useCallback(
    async (id: string, input: CategoryInput) => {
      const category = await updateCategory(id, input);
      reload();
      return category;
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string, reassignToCategoryId?: string) => {
      await deleteCategory(id, reassignToCategoryId);
      reload();
    },
    [reload],
  );

  return { categories, loading, error, reload, create, update, remove };
}
