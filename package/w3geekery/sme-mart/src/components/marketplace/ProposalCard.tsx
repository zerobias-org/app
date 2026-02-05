'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Button,
} from '@mui/material';

export interface ProposalData {
  id: string;
  requestId: string | null;
  providerId: string | null;
  coverLetter: string | null;
  proposedPrice: string | null;
  proposedTimeline: string | null;
  status: string;
  createdAt: string;
  provider: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    headline: string | null;
    ratingAverage: string | null;
    slug: string;
  } | null;
}

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  withdrawn: 'default',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

interface ProposalCardProps {
  proposal: ProposalData;
  isBuyer: boolean;
  isOwnProposal: boolean;
  onAccept?: (proposalId: string) => void;
  onReject?: (proposalId: string) => void;
  onWithdraw?: (proposalId: string) => void;
  updating?: boolean;
}

export function ProposalCard({
  proposal,
  isBuyer,
  isOwnProposal,
  onAccept,
  onReject,
  onWithdraw,
  updating,
}: ProposalCardProps) {
  const provider = proposal.provider;
  const initials = provider
    ? provider.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        {/* Header: Provider info + Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Avatar
              src={provider?.avatarUrl || undefined}
              sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 14 }}
            >
              {initials}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {provider?.displayName || 'Unknown Provider'}
              </Typography>
              {provider?.headline && (
                <Typography variant="caption" color="text.secondary">
                  {provider.headline}
                </Typography>
              )}
            </Box>
          </Box>
          <Chip
            label={STATUS_LABELS[proposal.status] || proposal.status}
            size="small"
            color={STATUS_COLORS[proposal.status] || 'default'}
          />
        </Box>

        {/* Price + Timeline */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {proposal.proposedPrice && (
            <Box>
              <Typography variant="caption" color="text.secondary">Price</Typography>
              <Typography variant="body2" fontWeight={600}>${proposal.proposedPrice}</Typography>
            </Box>
          )}
          {proposal.proposedTimeline && (
            <Box>
              <Typography variant="caption" color="text.secondary">Timeline</Typography>
              <Typography variant="body2" fontWeight={600}>{proposal.proposedTimeline}</Typography>
            </Box>
          )}
          {provider?.ratingAverage && (
            <Box>
              <Typography variant="caption" color="text.secondary">Rating</Typography>
              <Typography variant="body2" fontWeight={600}>★ {provider.ratingAverage}</Typography>
            </Box>
          )}
        </Box>

        {/* Cover Letter */}
        {proposal.coverLetter && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
            {proposal.coverLetter}
          </Typography>
        )}

        {/* Submitted date */}
        <Typography variant="caption" color="text.secondary">
          Submitted {new Date(proposal.createdAt).toLocaleDateString()}
        </Typography>

        {/* Actions */}
        {proposal.status === 'pending' && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {isBuyer && onAccept && onReject && (
              <>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onAccept(proposal.id)}
                  disabled={updating}
                  sx={{ color: '#fff !important' }}
                >
                  Accept
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => onReject(proposal.id)}
                  disabled={updating}
                >
                  Reject
                </Button>
              </>
            )}
            {isOwnProposal && onWithdraw && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onWithdraw(proposal.id)}
                disabled={updating}
              >
                Withdraw
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
