'use client';

import Link from 'next/link';
import { Box, Card, CardContent, Typography, Chip, Tooltip } from '@mui/material';
import { getLifecycleLabel } from '@/lib/engagement-lifecycle';

export interface ProposalSummary {
  id: string;
  providerId: string | null;
  status: string | null;
}

export interface EngagementCardData {
  id: string;
  buyerZerobiasUserId: string;
  title: string;
  description: string | null;
  category: string;
  budgetType: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  timeline: string | null;
  status: string;
  engagementTag: string | null;
  createdAt: string;
  proposals?: ProposalSummary[];
}

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'info' | 'default' | 'error'> = {
  draft: 'warning',
  open: 'success',
  in_progress: 'info',
  completed: 'default',
  cancelled: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatBudget(engagement: EngagementCardData): string | null {
  if (!engagement.budgetMin && !engagement.budgetMax) return null;
  if (engagement.budgetMin && engagement.budgetMax) {
    return `$${engagement.budgetMin} – $${engagement.budgetMax}`;
  }
  if (engagement.budgetMax) return `Up to $${engagement.budgetMax}`;
  if (engagement.budgetMin) return `From $${engagement.budgetMin}`;
  return null;
}

interface EngagementCardProps {
  engagement: EngagementCardData;
  currentProviderId?: string | null;
}

const PROPOSAL_STATUS_COLORS: Record<string, 'default' | 'success' | 'error' | 'warning'> = {
  pending: 'default',
  accepted: 'success',
  rejected: 'error',
  withdrawn: 'warning',
};

export function EngagementCard({ engagement, currentProviderId }: EngagementCardProps) {
  const budget = formatBudget(engagement);
  const lifecycleLabel = getLifecycleLabel(engagement.engagementTag);
  const isRfp = lifecycleLabel === 'RFP';

  // Check if current provider has proposed on this engagement
  const myProposal = currentProviderId
    ? engagement.proposals?.find((p) => p.providerId === currentProviderId)
    : null;

  return (
    <Link href={`/engagements/${engagement.id}`} style={{ textDecoration: 'none' }}>
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
        }}
      >
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Lifecycle + Status + Tag + Category */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <Tooltip title={isRfp ? 'Request for Proposal' : ''} enterDelay={300} arrow>
              <Chip
                label={lifecycleLabel}
                size="small"
                color={isRfp ? 'info' : 'primary'}
                variant="filled"
              />
            </Tooltip>
            <Chip
              label={STATUS_LABELS[engagement.status] || engagement.status}
              size="small"
              color={STATUS_COLORS[engagement.status] || 'default'}
            />
            {engagement.engagementTag && (
              <Chip
                label={engagement.engagementTag}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.7rem' }}
              />
            )}
            <Chip label={engagement.category} size="small" color="secondary" variant="outlined" />
            {myProposal && (
              <Chip
                label={myProposal.status === 'accepted' ? 'Accepted' : myProposal.status === 'rejected' ? 'Rejected' : 'Proposed'}
                size="small"
                color={PROPOSAL_STATUS_COLORS[myProposal.status || 'pending'] || 'default'}
                variant="filled"
              />
            )}
          </Box>

          {/* Title */}
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {engagement.title}
          </Typography>

          {/* Description */}
          {engagement.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {engagement.description}
            </Typography>
          )}

          {/* Budget + Timeline */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
            {budget && (
              <Chip label={budget} size="small" color="primary" variant="outlined" />
            )}
            {engagement.budgetType && (
              <Chip
                label={engagement.budgetType === 'fixed' ? 'Fixed' : engagement.budgetType === 'hourly' ? 'Hourly' : 'Negotiable'}
                size="small"
              />
            )}
            {engagement.timeline && (
              <Chip label={engagement.timeline} size="small" variant="outlined" />
            )}
          </Box>

          {/* Posted date */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }}>
            Posted {new Date(engagement.createdAt).toLocaleDateString()}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
}
