'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  InputAdornment,
  Alert,
} from '@mui/material';

interface ProposalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  requestId: string;
  providerId: string;
}

export function ProposalForm({ open, onClose, onSubmitted, requestId, providerId }: ProposalFormProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedTimeline, setProposedTimeline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          providerId,
          coverLetter: coverLetter.trim() || null,
          proposedPrice: proposedPrice || null,
          proposedTimeline: proposedTimeline.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit proposal');
      }

      // Reset form and notify parent
      setCoverLetter('');
      setProposedPrice('');
      setProposedTimeline('');
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Submit Proposal</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Cover Letter"
          multiline
          rows={4}
          placeholder="Describe your qualifications, approach, and why you're a great fit for this work..."
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          fullWidth
        />

        <TextField
          label="Proposed Price"
          type="number"
          placeholder="Your price for this work"
          value={proposedPrice}
          onChange={(e) => setProposedPrice(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            },
          }}
        />

        <TextField
          label="Proposed Timeline"
          placeholder="e.g., 2 weeks, 10 business days, ASAP"
          value={proposedTimeline}
          onChange={(e) => setProposedTimeline(e.target.value)}
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ color: '#fff !important' }}
        >
          {submitting ? 'Submitting...' : 'Submit Proposal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
