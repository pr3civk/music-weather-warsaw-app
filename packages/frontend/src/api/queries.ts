import { api } from './client';
import {
  currentResponseSchema, type CurrentResponse,
  weatherListSchema, type WeatherList,
  trackListSchema, type TrackList,
  correlationResponseSchema, type CorrelationResponse,
  triggerResponseSchema, type TriggerResponse,
} from '@mw/shared';

export const queries = {
  current: () => ({
    queryKey: ['current'] as const,
    queryFn: (): Promise<CurrentResponse> => api.get('/api/current', currentResponseSchema),
  }),
  weather: (from?: string, to?: string) => ({
    queryKey: ['weather', from ?? null, to ?? null] as const,
    queryFn: (): Promise<WeatherList> => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const q = params.toString();
      return api.get(`/api/weather${q ? `?${q}` : ''}`, weatherListSchema);
    },
  }),
  music: (from?: string, to?: string, limit = 50) => ({
    queryKey: ['music', from ?? null, to ?? null, limit] as const,
    queryFn: (): Promise<TrackList> => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return api.get(`/api/music?${params.toString()}`, trackListSchema);
    },
  }),
  correlation: (from?: string, to?: string) => ({
    queryKey: ['correlation', from ?? null, to ?? null] as const,
    queryFn: (): Promise<CorrelationResponse> => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const q = params.toString();
      return api.get(`/api/correlation${q ? `?${q}` : ''}`, correlationResponseSchema);
    },
  }),
};

export const mutations = {
  trigger: () => ({
    mutationFn: (): Promise<TriggerResponse> => api.post('/api/admin/trigger', undefined, triggerResponseSchema),
  }),
};
