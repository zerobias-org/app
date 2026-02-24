import { ProposalStatus } from './enums';

export interface Proposal {
  id: string;
  request_id: string | null;
  provider_id: string | null;
  cover_letter: string | null;
  proposed_price: string | null;
  proposed_timeline: string | null;
  status: ProposalStatus;
  created_at: string;
}
