export type UserMediaItem = {
  id: number;
  url: string | null;
  path: string;
  kind: string;
  sort_order: number;
};

export type UserMe = {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_path: string | null;
  avatar_url: string | null;
  needs_profile_completion: boolean;
  created_at: string | null;
  updated_at: string | null;
  media: UserMediaItem[];
};
