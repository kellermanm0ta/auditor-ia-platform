import useSWR from 'swr';
import type { OutputFormat } from '@/lib/types';
import { fetcher } from '@/lib/api';

export function useOutputFormats() {
  return useSWR<OutputFormat[]>('/output-formats', fetcher);
}