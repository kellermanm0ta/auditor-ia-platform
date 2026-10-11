import useSWR from 'swr';
import type { HistoryItem } from '@/lib/types';
import { fetcher } from '@/lib/api';

export function useHistory() {
  return useSWR<HistoryItem[]>('/history', fetcher);
}