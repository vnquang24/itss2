import type { Role } from '@prisma/client';

export const CHANNEL_VISIBILITIES = ['PUBLIC', 'MENTOR_EMPLOYER'] as const;

export type ChannelVisibility = (typeof CHANNEL_VISIBILITIES)[number];

export function canAccessChannelVisibility(
  role: Role | null | undefined,
  visibility: ChannelVisibility,
) {
  if (visibility === 'PUBLIC') return true;
  return role === 'MENTOR' || role === 'EMPLOYER' || role === 'ADMIN';
}

export function canCreateRestrictedChannel(role: Role | null | undefined) {
  return role === 'MENTOR' || role === 'EMPLOYER' || role === 'ADMIN';
}

export function buildApprovedChannelWhere(role: Role | null | undefined) {
  if (role === 'ADMIN') {
    return { approved: true };
  }

  if (canCreateRestrictedChannel(role)) {
    return {
      approved: true,
      visibility: { in: ['PUBLIC', 'MENTOR_EMPLOYER'] as ChannelVisibility[] },
    };
  }

  return {
    approved: true,
    visibility: 'PUBLIC' as ChannelVisibility,
  };
}
