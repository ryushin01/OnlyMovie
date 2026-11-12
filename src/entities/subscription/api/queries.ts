import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestJson } from '@/shared/api/request';
import type { PlanId } from '../model/plans';
import { SubscriptionDataSchema } from './schemas';

const KEY = 'subscription';

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** 회원마다 따로 저장해, 로그아웃 뒤 다른 회원에게 이전 이용권이 보이지 않게 합니다. */
export const useSubscription = (userId: string | undefined) =>
  useQuery({
    queryKey: [KEY, userId],
    queryFn: () => requestJson('/api/subscription', SubscriptionDataSchema),
    enabled: Boolean(userId),
  });

export interface SubscribeInput {
  plan: PlanId;
  simulateFailure: boolean;
}

export type SubscriptionChange = { action: 'cancel' | 'resume' } | { action: 'change'; plan: PlanId };

export function useSubscribe() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: SubscribeInput) =>
      requestJson('/api/subscription', SubscriptionDataSchema, json('POST', input)),
    onSuccess: () => client.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useChangeSubscription() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (change: SubscriptionChange) =>
      requestJson('/api/subscription', SubscriptionDataSchema, json('PATCH', change)),
    onSuccess: () => client.invalidateQueries({ queryKey: [KEY] }),
  });
}
