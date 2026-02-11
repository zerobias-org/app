'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useZeroBias } from '@/context/ZeroBiasContext';
import { ProposalForm } from '@/components/marketplace/ProposalForm';
import { ProposalCard, type ProposalData } from '@/components/marketplace/ProposalCard';
import { getLifecycleLabel } from '@/lib/engagement-lifecycle';

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

const BUDGET_TYPE_LABELS: Record<string, string> = {
  fixed: 'Fixed Price',
  hourly: 'Hourly',
  negotiable: 'Negotiable',
};

interface Engagement {
  id: string;
  buyerZerobiasUserId: string;
  buyerZerobiasOrgId: string | null;
  title: string;
  description: string | null;
  category: string;
  budgetType: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  timeline: string | null;
  status: string;
  engagementTag: string | null;
  zerobiasTagId: string | null;
  zerobiasTaskId: string | null;
  createdAt: string;
  proposals: ProposalData[];
}

function formatBudget(engagement: Engagement): string {
  if (!engagement.budgetMin && !engagement.budgetMax) return 'Not specified';
  if (engagement.budgetMin && engagement.budgetMax) return `$${engagement.budgetMin} – $${engagement.budgetMax}`;
  if (engagement.budgetMax) return `Up to $${engagement.budgetMax}`;
  if (engagement.budgetMin) return `From $${engagement.budgetMin}`;
  return 'Not specified';
}

export default function EngagementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useZeroBias();

  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [updating, setUpdating] = useState(false);
  const [proposalFormOpen, setProposalFormOpen] = useState(false);

  const engagementId = params.engagementId as string;

  const fetchEngagement = useCallback(() => {
    fetch(`/api/engagements/${engagementId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => setEngagement(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [engagementId]);

  useEffect(() => {
    fetchEngagement();
  }, [fetchEngagement]);

  const isOwner = user && engagement && user.id === engagement.buyerZerobiasUserId;

  // Find provider profile ID for current user (to check if they already proposed)
  const [currentProviderProfile, setCurrentProviderProfile] = useState<{ id: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/profile?zerobiasUserId=${user.id}&lookup=true`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCurrentProviderProfile({ id: data.id });
      })
      .catch(() => { /* not a provider */ });
  }, [user]);

  const hasAlreadyProposed = engagement?.proposals?.some(
    (p) => p.providerId === currentProviderProfile?.id
  );

  const handleCancel = async () => {
    if (!engagement || !user) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/engagements/${engagement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', buyerZerobiasUserId: user.id }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEngagement({ ...engagement, status: updated.status });
        setSnackbar('Engagement cancelled');
      }
    } catch {
      setSnackbar('Failed to cancel engagement');
    } finally {
      setUpdating(false);
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    if (!user) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted', buyerZerobiasUserId: user.id }),
      });
      if (res.ok) {
        setSnackbar('Proposal accepted');
        fetchEngagement(); // Refresh to get updated statuses
      } else {
        const data = await res.json();
        setSnackbar(data.error || 'Failed to accept proposal');
      }
    } catch {
      setSnackbar('Failed to accept proposal');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    if (!user) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', buyerZerobiasUserId: user.id }),
      });
      if (res.ok) {
        setSnackbar('Proposal rejected');
        fetchEngagement();
      } else {
        const data = await res.json();
        setSnackbar(data.error || 'Failed to reject proposal');
      }
    } catch {
      setSnackbar('Failed to reject proposal');
    } finally {
      setUpdating(false);
    }
  };

  const handleWithdrawProposal = async (proposalId: string) => {
    if (!currentProviderProfile) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'withdrawn', providerId: currentProviderProfile.id }),
      });
      if (res.ok) {
        setSnackbar('Proposal withdrawn');
        fetchEngagement();
      } else {
        const data = await res.json();
        setSnackbar(data.error || 'Failed to withdraw proposal');
      }
    } catch {
      setSnackbar('Failed to withdraw proposal');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={40} />
      </Container>
    );
  }

  if (error || !engagement) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Engagement not found.</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/engagements')}
          sx={{ mt: 2 }}
        >
          Back to Engagements
        </Button>
      </Container>
    );
  }

  const proposalCount = engagement.proposals?.length || 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push('/engagements')}
        sx={{ mb: 3 }}
      >
        Back to Engagements
      </Button>

      <Grid container spacing={3}>
        {/* Left Column — Engagement Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              {/* Header */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {(() => {
                  const label = getLifecycleLabel(engagement.engagementTag);
                  const isRfp = label === 'RFP';
                  return (
                    <Tooltip title={isRfp ? 'Request for Proposal' : ''} enterDelay={300} arrow>
                      <Chip
                        label={label}
                        color={isRfp ? 'info' : 'primary'}
                        variant="filled"
                      />
                    </Tooltip>
                  );
                })()}
                <Chip
                  label={STATUS_LABELS[engagement.status] || engagement.status}
                  color={STATUS_COLORS[engagement.status] || 'default'}
                />
                {engagement.engagementTag && (
                  <Chip
                    label={engagement.engagementTag}
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                  />
                )}
                <Chip label={engagement.category} color="secondary" variant="outlined" />
              </Box>

              <Typography variant="h4" fontWeight={600} gutterBottom>
                {engagement.title}
              </Typography>

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
                Posted {new Date(engagement.createdAt).toLocaleDateString()} by {engagement.buyerZerobiasUserId}
              </Typography>

              {/* Description */}
              {engagement.description && (
                <>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                    {engagement.description}
                  </Typography>
                </>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Details Grid */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">Budget</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatBudget(engagement)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">Budget Type</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {engagement.budgetType ? BUDGET_TYPE_LABELS[engagement.budgetType] || engagement.budgetType : 'Not specified'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">Timeline</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {engagement.timeline || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Proposals Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Proposals ({proposalCount})
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {proposalCount === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No proposals yet.
                  </Typography>
                </Paper>
              ) : (
                engagement.proposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    isBuyer={!!isOwner}
                    isOwnProposal={proposal.providerId === currentProviderProfile?.id}
                    onAccept={handleAcceptProposal}
                    onReject={handleRejectProposal}
                    onWithdraw={handleWithdrawProposal}
                    updating={updating}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column — Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* ZeroBias Integration Info */}
          {(engagement.zerobiasTaskId || engagement.zerobiasTagId) && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  ZeroBias
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {engagement.zerobiasTaskId && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Task ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                      {engagement.zerobiasTaskId}
                    </Typography>
                  </Box>
                )}
                {engagement.zerobiasTagId && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Tag ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                      {engagement.zerobiasTagId}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {isOwner ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {engagement.status === 'open' && (
                    <Tooltip title="Request for Proposal" enterDelay={300} arrow>
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={handleCancel}
                        disabled={updating}
                      >
                        {updating ? 'Cancelling...' : 'Cancel RFP'}
                      </Button>
                    </Tooltip>
                  )}
                  {engagement.status === 'draft' && (
                    <Tooltip title="Request for Proposal" enterDelay={300} arrow>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        This RFP is in draft. Publish it to start receiving proposals.
                      </Typography>
                    </Tooltip>
                  )}
                  {engagement.status === 'cancelled' && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      This {getLifecycleLabel(engagement.engagementTag).toLowerCase()} has been cancelled.
                    </Typography>
                  )}
                  {engagement.status === 'completed' && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      This engagement has been completed.
                    </Typography>
                  )}
                  {engagement.status === 'in_progress' && (
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={handleCancel}
                      disabled={updating}
                    >
                      {updating ? 'Cancelling...' : 'Cancel Engagement'}
                    </Button>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {engagement.status === 'open' && currentProviderProfile && !hasAlreadyProposed && (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => setProposalFormOpen(true)}
                    >
                      Submit Proposal
                    </Button>
                  )}
                  {engagement.status === 'open' && hasAlreadyProposed && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      You have already submitted a proposal.
                    </Typography>
                  )}
                  {engagement.status === 'open' && !currentProviderProfile && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      Create a provider profile to submit proposals.
                    </Typography>
                  )}
                  {engagement.status !== 'open' && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      This {getLifecycleLabel(engagement.engagementTag).toLowerCase()} is no longer accepting proposals.
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Proposal Form Dialog */}
      {currentProviderProfile && (
        <ProposalForm
          open={proposalFormOpen}
          onClose={() => setProposalFormOpen(false)}
          onSubmitted={() => {
            setSnackbar('Proposal submitted!');
            fetchEngagement();
          }}
          requestId={engagement.id}
          providerId={currentProviderProfile.id}
        />
      )}

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Container>
  );
}
