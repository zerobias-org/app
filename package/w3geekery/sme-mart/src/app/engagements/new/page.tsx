'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useZeroBias } from '@/context/ZeroBiasContext';

const CATEGORIES = [
  'Assessors',
  'Advisors',
  'Agentic',
  'SecOps',
  'DevSecOps',
  'Data Services',
  'Training',
  'Engineering',
];

export default function NewEngagementPage() {
  const router = useRouter();
  const { user, org, loading } = useZeroBias();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budgetType, setBudgetType] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [timeline, setTimeline] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const canSubmit = title.trim() && category && !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerZerobiasUserId: user.id,
          buyerZerobiasOrgId: org?.id || null,
          title: title.trim(),
          description: description.trim() || null,
          category,
          budgetType: budgetType || null,
          budgetMin: budgetMin || null,
          budgetMax: budgetMax || null,
          timeline: timeline.trim() || null,
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
        Back to Engagements
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
          <Grid container spacing={3}>
            {/* Title */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="Title"
                placeholder="e.g., SOC 2 Type II Audit Support"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Grid>

            {/* Description */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                placeholder="Describe the work you need, requirements, expectations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>

            {/* Category */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Budget Type */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Budget Type</InputLabel>
                <Select
                  value={budgetType}
                  label="Budget Type"
                  onChange={(e) => setBudgetType(e.target.value)}
                >
                  <MenuItem value="">Not specified</MenuItem>
                  <MenuItem value="fixed">Fixed Price</MenuItem>
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="negotiable">Negotiable</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Budget Range */}
            {budgetType && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Budget Min"
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Budget Max"
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      },
                    }}
                  />
                </Grid>
              </>
            )}

            {/* Timeline */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="Timeline"
                placeholder="e.g., 4 weeks, ASAP, Q2 2026"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              />
            </Grid>
          </Grid>

          {/* Submit */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => router.push('/engagements')}>
              Cancel
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? 'Creating RFP...' : 'Post RFP'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
