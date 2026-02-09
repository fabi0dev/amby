import { mergeQueryKeys } from '@lukemorales/query-key-factory';
import { workspaces } from './query-keys/workspaces';
import { documents } from './query-keys/documents';
import { shares } from './query-keys/shares';

export const queryKeys = mergeQueryKeys(workspaces, documents, shares);
