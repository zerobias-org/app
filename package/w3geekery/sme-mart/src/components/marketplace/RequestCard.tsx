'use client';

import Link from 'next/link';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';

export interface RequestCardData {
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
  createdAt: string;
}

const STATUS_COLORS: Record<string, 'success' | 'info' | 'default' | 'error'> = {
  open: 'success',
  in_progress: 'info',
  completed: 'default',
  cancelled: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatBudget(request: RequestCardData): string | null {
  if (!request.budgetMin && !request.budgetMax) return null;
  if (request.budgetMin && request.budgetMax) {
    return `$${request.budgetMin} – $${request.budgetMax}`;
  }
  if (request.budgetMax) return `Up to $${request.budgetMax}`;
  if (request.budgetMin) return `From $${request.budgetMin}`;
  return null;
}

interface RequestCardProps {
  request: RequestCardData;
}

export function RequestCard({ request }: RequestCardProps) {
  const budget = formatBudget(request);

  return (
    <Link href={`/requests/${request.id}`} style={{ textDecoration: 'none' }}>
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
          {/* Status + Category */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <Chip
              label={STATUS_LABELS[request.status] || request.status}
              size="small"
              color={STATUS_COLORS[request.status] || 'default'}
            />
            <Chip label={request.category} size="small" color="secondary" variant="outlined" />
          </Box>

          {/* Title */}
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {request.title}
          </Typography>

          {/* Description */}
          {request.description && (
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
              {request.description}
            </Typography>
          )}

          {/* Budget + Timeline */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
            {budget && (
              <Chip label={budget} size="small" color="primary" variant="outlined" />
            )}
            {request.budgetType && (
              <Chip
                label={request.budgetType === 'fixed' ? 'Fixed' : request.budgetType === 'hourly' ? 'Hourly' : 'Negotiable'}
                size="small"
              />
            )}
            {request.timeline && (
              <Chip label={request.timeline} size="small" variant="outlined" />
            )}
          </Box>

          {/* Posted date */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }}>
            Posted {new Date(request.createdAt).toLocaleDateString()}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
}
