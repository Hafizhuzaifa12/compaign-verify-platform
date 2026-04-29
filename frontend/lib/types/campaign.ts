export type CampaignListItem = {
  id: number;
  user_id: number;
  title: string;
  type: string;
  content: string;
  url: string;
  status: string;
  marketing_tips?: string[];
  security_warnings?: unknown;
  tx_hash?: string;
  content_hash_sha256?: string;
};
