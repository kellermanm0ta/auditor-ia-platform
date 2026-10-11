import useSWR from 'swr';
import type { Integration } from '@/lib/types';
import { fetcher } from '@/lib/api';

export function useIntegrations() {
  return useSWR<Integration[]>('/integrations', fetcher);
}