'use client';

import { useState, useRef } from 'react';
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
import { useRouter } from 'next/navigation';
import { useZeroBias } from '@/context/ZeroBiasContext';
import { EngagementForm, isFormValid, type EngagementFormValues } from '@/components/marketplace/EngagementForm';

export default function NewEngagementPage() {
  const router = useRouter();
  const { user, org, loading } = useZeroBias();

  const formValues = useRef<EngagementFormValues>({
    title: '', description: '', category: '', budgetType: '',
    budgetMin: '', budgetMax: '', timeline: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Please sign in to post an RFP.</Alert>
      </Container>
    );
  }

  const handleValuesChange = (values: EngagementFormValues) => {
    formValues.current = values;
    setCanSubmit(isFormValid(values));
  };

  const handleSubmit = async (status: 'open' | 'draft') => {
    const v = formValues.current;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerZerobiasUserId: user.id,
          buyerZerobiasOrgId: org?.id || null,
          title: v.title.trim(),
          description: v.description.trim() || null,
          category: v.category,
          budgetType: v.budgetType || null,
          budgetMin: v.budgetMin || null,
          budgetMax: v.budgetMax || null,
          timeline: v.timeline.trim() || null,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create engagement');
      }

      const created = await res.json();
      router.push(`/engagements/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push('/engagements')}
        sx={{ mb: 2 }}
      >
        Back to RFPs & Engagements
      </Button>

      <Tooltip title="Request for Proposal" enterDelay={300} arrow>
        <Typography variant="h4" fontWeight={600} gutterBottom sx={{ width: 'fit-content' }}>
          Post an RFP
        </Typography>
      </Tooltip>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Describe the compliance work you need done. Providers will be able to view and submit proposals.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <EngagementForm
            onValuesChange={handleValuesChange}
            disabled={submitting}
          />

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => router.push('/engagements')}>
              Cancel
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleSubmit('draft')}
              disabled={!canSubmit || submitting}
            >
              {submitting ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => handleSubmit('open')}
              disabled={!canSubmit || submitting}
            >
              {submitting ? 'Creating RFP...' : 'Post RFP'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
