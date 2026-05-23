export type Role = 'master' | 'admin' | 'member' | 'pending';

export type Profile = {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  role: Role;
  created_at?: string;
  updated_at?: string;
};

export type SeasonEntry = {
  id: string;
  user_id: string;
  in_date: string;
  out_date: string;
  profiles?: Profile;
};

export type VoteCategory = 'riding' | 'mt' | 'etc';

export const VOTE_CATEGORY_LABEL: Record<VoteCategory, string> = {
  riding: '라이딩',
  mt: '엠티',
  etc: '기타',
};

export type Vote = {
  id: string;
  title: string;
  description: string | null;
  capacity: number;
  category: VoteCategory;
  opens_at: string;
  closes_at: string | null;
  created_by: string;
  created_at: string;
};

export type VoteEntry = {
  id: string;
  vote_id: string;
  user_id: string;
  queue_number: number;
  status: 'confirmed' | 'waiting';
  uses_own_board: boolean;
  created_at: string;
  profiles?: Profile;
};

export type Post = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'id' | 'nickname' | 'avatar_url'>;
};

export type Notice = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  pinned_order: number | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'id' | 'nickname' | 'avatar_url'>;
};

export type Skateboard = {
  id: string;
  number: number;
  notes: string | null;
  active: boolean;
  created_at: string;
};

export type SkateboardRental = {
  id: string;
  skateboard_id: string;
  user_id: string;
  rented_at: string;
  returned_at: string | null;
  notes: string | null;
  created_at: string;
  profiles?: Pick<Profile, 'id' | 'nickname' | 'avatar_url'>;
};

export type SkateboardWithActiveRental = Skateboard & {
  activeRental: SkateboardRental | null;
};
