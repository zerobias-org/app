'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useZeroBias } from '@/context/ZeroBiasContext';
import { EngagementForm, isFormValid, type EngagementFormValues } from '@/components/marketplace/EngagementForm';

export default function EditEngagementPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useZeroBias();
  const engagementId = params.engagementId as string;

  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState<Record<string, unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);

  const formValues = useRef<EngagementFormValues>({
    title: '', description: '', category: '', budgetType: '',
    budgetMin: '', budgetMax: '', timeline: '',
  });

  useEffect(() => {
    fetch(`/api/engagements/${engagementId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setEngagement(data);
        const initial: EngagementFormValues = {
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          budgetType: data.budgetType || '',
          budgetMin: data.budgetMin || '',
          budgetMax: data.budgetMax || '',
          timeline: data.timeline || '',
        };
        formValues.current = initial;
        setCanSubmit(isFormValid(initial));
      })
      .catch(() => setError('Engagement not found'))
      .finally(() => setLoading(false));
  }, [engagementId]);

  if (authLoading || loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !engagement) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Engagement not found'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/engagements')} sx={{ mt: 2 }}>
          Back to RFPs & Engagements
        </Button>
      </Container>
    );
  }

  // Authorization checks
  if (!user || user.id !== engagement.buyerZerobiasUserId) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">You are not authorized to edit this RFP.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/engagements/${engagementId}`)} sx={{ mt: 2 }}>
          Back to RFP
        </Button>
      </Container>
    );
  }

  const status = engagement.status as string;
  if (status !== 'draft' && status !== 'open') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">This RFP can no longer be edited (status: {status}).</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/engagements/${engagementId}`)} sx={{ mt: 2 }}>
          Back to RFP
        </Button>
      </Container>
    );
  }

  const handleValuesChange = (values: EngagementFormValues) => {
    formValues.current = values;
    setCanSubmit(isFormValid(values));
  };

  const handleSave = async () => {
    const v = formValues.current;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/engagements/${engagementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerZerobiasUserId: user.id,
          title: v.title.trim(),
          description: v.description.trim() || null,
          category: v.category,
          budgetType: v.budgetType || null,
          budgetMin: v.budgetMin || null,
          budgetMax: v.budgetMax || null,
          timeline: v.timeline.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save changes');
      }

      router.push(`/engagements/${engagementId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/engagements/${engagementId}`)}
        sx={{ mb: 2 }}
      >
        Back to RFP
      </Button>

      <Tooltip title="Request for Proposal" enterDelay={300} arrow>
        <Typography variant="h4" fontWeight={600} gutterBottom sx={{ width: 'fit-content' }}>
          Edit RFP
        </Typography>
      </Tooltip>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Update your request for proposal details.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <EngagementForm
            initialValues={formValues.current}
            onValuesChange={handleValuesChange}
            disabled={submitting}
          />

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => router.push(`/engagements/${engagementId}`)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={!canSubmit || submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
