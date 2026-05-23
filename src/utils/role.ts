import { Role } from '../types';

export const ROLE_LABEL: Record<Role, string> = {
  master: '마스터',
  admin: '운영자',
  member: '일반회원',
  pending: '준회원',
};

export const ROLE_LABEL_FULL: Record<Role, string> = {
  master: '마스터 관리자',
  admin: '운영자',
  member: '일반회원',
  pending: '준회원 (가입 대기)',
};

export const ROLE_BADGE_CLASS: Record<Role, string> = {
  master: 'bg-[#1a1a1a]',
  admin: 'bg-[#3b82f6]',
  member: 'bg-[#9ca3af]',
  pending: 'bg-[#f59e0b]',
};
