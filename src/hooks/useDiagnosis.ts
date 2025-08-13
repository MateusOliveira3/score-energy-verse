import useSWR from 'swr';

type Options = { limit?: number };
export function useDiagnosis(userId?: string, options: Options = {}) {
  const { limit = 50 } = options;
  const shouldFetch = Boolean(userId);
  const key = shouldFetch ? [`/api/users/${userId}/diagnosis`, limit] : null;

  const swr = useSWR(key, async ([url, lim]) => {
    const u = lim ? `${url}?limit=${lim}` : url;
    const res = await fetch(u);
    if (!res.ok) throw new Error('Falha ao buscar diagnosis');
    return await res.json();
  });

  // normaliza: pode ser {items:[]} ou []
  const list = Array.isArray(swr.data)
    ? swr.data
    : Array.isArray(swr.data?.items)
      ? swr.data.items
      : [];

  return { ...swr, items: list, mutate: swr.mutate };
}
