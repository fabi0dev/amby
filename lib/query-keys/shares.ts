import { createQueryKeys } from '@lukemorales/query-key-factory';

export const shares = createQueryKeys('shares', {
  all: (documentId: string) => ({
    queryKey: [documentId],
    queryFn: null,
  }),
  detail: (token: string) => ({
    queryKey: [token],
    queryFn: null,
  }),
});
