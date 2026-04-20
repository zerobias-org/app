export type ComplianceStatus = 'met' | 'partially_met' | 'not_met' | 'not_applicable' | 'planned';

export interface BidResponse {
  id: string;
  bid_id: string;
  requirement_id: string;

  compliance_status: ComplianceStatus;
  response_text?: string | null;
  estimated_hours?: number | null;
  estimated_cost?: number | null;

  certification_ref?: string | null;
  ready_date?: string | null;

  responded_at?: string | null;
  updated_at?: string | null;
}

export interface ComplianceSummary {
  met: number;
  partially_met: number;
  not_met: number;
  not_applicable: number;
  planned: number;
  total: number;
  responded: number;
}

export const COMPLIANCE_STATUS_OPTIONS: { value: ComplianceStatus; label: string; color: string }[] = [
  { value: 'met', label: 'Met', color: '#4caf50' },
  { value: 'partially_met', label: 'Partially Met', color: '#ff9800' },
  { value: 'not_met', label: 'Not Met', color: '#f44336' },
  { value: 'not_applicable', label: 'N/A', color: '#9e9e9e' },
  { value: 'planned', label: 'Planned', color: '#2196f3' },
];
