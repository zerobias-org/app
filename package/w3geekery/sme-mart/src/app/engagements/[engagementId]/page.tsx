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
  Tabs,
  Tab,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useZeroBias } from '@/context/ZeroBiasContext';
import { ProposalForm } from '@/components/marketplace/ProposalForm';
import { ProposalCard, type ProposalData } from '@/components/marketplace/ProposalCard';
import { getLifecycleLabel, isEngagementPhase } from '@/lib/engagement-lifecycle';

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
  const [activeTab, setActiveTab] = useState(0);

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
        setSnackbar('RFP closed');
      }
    } catch {
      setSnackbar('Failed to close RFP');
    } finally {
      setUpdating(false);
    }
  };

  const handlePublish = async () => {
    if (!engagement || !user) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/engagements/${engagement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'open', buyerZerobiasUserId: user.id }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEngagement({ ...engagement, status: updated.status });
        setSnackbar('RFP published');
      }
    } catch {
      setSnackbar('Failed to publish RFP');
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
          Back to RFPs & Engagements
        </Button>
      </Container>
    );
  }

  const proposalCount = engagement.proposals?.length || 0;
  const isEngagement = isEngagementPhase(engagement.engagementTag);
  const acceptedProposal = engagement.proposals?.find((p) => p.status === 'accepted');

  // --- RFP View (no engagementTag) ---
  if (!isEngagement) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/engagements')}
          sx={{ mb: 3 }}
        >
          Back to RFPs & Engagements
        </Button>

        <Grid container spacing={3}>
          {/* Left Column — RFP Details */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Tooltip title="Request for Proposal" enterDelay={300} arrow>
                    <Chip label="RFP" color="info" variant="filled" />
                  </Tooltip>
                  <Chip
                    label={STATUS_LABELS[engagement.status] || engagement.status}
                    color={STATUS_COLORS[engagement.status] || 'default'}
                  />
                  <Chip label={engagement.category} color="secondary" variant="outlined" />
                </Box>

                <Typography variant="h4" fontWeight={600} gutterBottom>
                  {engagement.title}
                </Typography>

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
                  Posted {new Date(engagement.createdAt).toLocaleDateString()}
                </Typography>

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
                    {(engagement.status === 'draft' || engagement.status === 'open') && (
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => router.push(`/engagements/${engagement.id}/edit`)}
                      >
                        Edit RFP
                      </Button>
                    )}
                    {engagement.status === 'draft' && (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handlePublish}
                        disabled={updating}
                      >
                        {updating ? 'Publishing...' : 'Publish RFP'}
                      </Button>
                    )}
                    {engagement.status === 'draft' && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        This RFP is in draft. Publish it to start receiving proposals.
                      </Typography>
                    )}
                    {engagement.status === 'open' && (
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={handleCancel}
                        disabled={updating}
                      >
                        {updating ? 'Closing...' : 'Close RFP'}
                      </Button>
                    )}
                    {engagement.status === 'cancelled' && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        This RFP has been cancelled.
                      </Typography>
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
                        This RFP is no longer accepting proposals.
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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

  // --- Transparency Center View (has engagementTag) ---
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push('/engagements')}
        sx={{ mb: 3 }}
      >
        Back to RFPs & Engagements
      </Button>

      {/* Engagement Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip label="Engagement" color="primary" variant="filled" />
          <Chip
            label={STATUS_LABELS[engagement.status] || engagement.status}
            color={STATUS_COLORS[engagement.status] || 'default'}
          />
          <Chip
            label={engagement.engagementTag}
            variant="outlined"
            sx={{ fontFamily: 'monospace', fontWeight: 600 }}
          />
          <Chip label={engagement.category} color="secondary" variant="outlined" />
        </Box>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          {engagement.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Created {new Date(engagement.createdAt).toLocaleDateString()}
        </Typography>
      </Box>

      {/* Tab Bar */}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Details" />
          <Tab label="Messages" />
          <Tab label="Files" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Overview — Left Column */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Engagement Summary */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Engagement Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {STATUS_LABELS[engagement.status] || engagement.status}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">Budget</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatBudget(engagement)}
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

            {/* Accepted Proposal */}
            {acceptedProposal && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Accepted Proposal
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <ProposalCard
                    proposal={acceptedProposal}
                    isBuyer={!!isOwner}
                    isOwnProposal={acceptedProposal.providerId === currentProviderProfile?.id}
                    onAccept={handleAcceptProposal}
                    onReject={handleRejectProposal}
                    onWithdraw={handleWithdrawProposal}
                    updating={updating}
                  />
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Overview — Right Column */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* ZeroBias Task Info */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  ZeroBias Task
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {engagement.zerobiasTaskId ? (
                  <Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Task ID</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                        {engagement.zerobiasTaskId}
                      </Typography>
                    </Box>
                    {engagement.zerobiasTagId && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">Tag ID</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                          {engagement.zerobiasTagId}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Full task integration (status, comments, attachments) coming in a future release.
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No ZeroBias task linked to this engagement.
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {isOwner && engagement.status === 'in_progress' && (
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
                  {engagement.status === 'completed' && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      This engagement has been completed.
                    </Typography>
                  )}
                  {engagement.status === 'cancelled' && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      This engagement has been cancelled.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Engagement Details
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {engagement.description && (
              <>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                  {engagement.description}
                </Typography>
              </>
            )}

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Category</Typography>
                <Typography variant="body1" fontWeight={500}>{engagement.category}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Budget</Typography>
                <Typography variant="body1" fontWeight={500}>{formatBudget(engagement)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Budget Type</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {engagement.budgetType ? BUDGET_TYPE_LABELS[engagement.budgetType] || engagement.budgetType : 'Not specified'}
                </Typography>
              </Grid>
            </Grid>

            {/* All Proposals (read-only in engagement phase) */}
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              Proposals ({proposalCount})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {proposalCount === 0 ? (
              <Typography color="text.secondary">No proposals.</Typography>
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
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Messages
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Coming Soon
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Messaging will use ZeroBias Task Comments for a full audit trail of all engagement communications.
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Files
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Coming Soon
              </Typography>
              <Typography variant="body2" color="text.secondary">
                File sharing will use ZeroBias Task Attachments for SOWs, deliverables, and evidence documents.
              </Typography>
            </Paper>
          </CardContent>
        </Card>
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
