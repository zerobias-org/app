'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  SelectChangeEvent,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useZeroBias } from '@/context/ZeroBiasContext';
import { useProfile, ProfileUpdateData } from '@/hooks/useProfile';

export default function OverviewPage() {
  const { user } = useZeroBias();
  const { profile, updateProfile, isUpdating } = useProfile();

  // Profile form state
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'unavailable'>('available');
  const [responseTime, setResponseTime] = useState('');
  const [profileDirty, setProfileDirty] = useState(false);

  // Sync profile data into form state when loaded
  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline || '');
      setAbout(profile.about || '');
      setHourlyRate(profile.hourlyRate || '');
      setAvailabilityStatus(profile.availabilityStatus || 'available');
      setResponseTime(profile.responseTime || '');
      setProfileDirty(false);
    }
  }, [profile]);

  const markDirty = () => {
    if (!profileDirty) setProfileDirty(true);
  };

  const handleSaveProfile = () => {
    const data: ProfileUpdateData = {
      headline: headline || null,
      about: about || null,
      hourlyRate: hourlyRate || null,
      availabilityStatus,
      responseTime: responseTime || null,
    };
    updateProfile(data);
    setProfileDirty(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Profile Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Provider Profile
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Display Name"
                value={user?.displayName || ''}
                disabled
                helperText="Managed by ZeroBias"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Headline"
                value={headline}
                onChange={(e) => { setHeadline(e.target.value); markDirty(); }}
                placeholder="e.g., SOC 2 Expert | ISO 27001 Lead Auditor"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="About"
                multiline
                rows={3}
                value={about}
                onChange={(e) => { setAbout(e.target.value); markDirty(); }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Hourly Rate"
                type="number"
                value={hourlyRate}
                onChange={(e) => { setHourlyRate(e.target.value); markDirty(); }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={availabilityStatus}
                  label="Availability"
                  onChange={(e: SelectChangeEvent) => {
                    setAvailabilityStatus(e.target.value as 'available' | 'busy' | 'unavailable');
                    markDirty();
                  }}
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="busy">Busy</MenuItem>
                  <MenuItem value="unavailable">Unavailable</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Response Time"
                value={responseTime}
                onChange={(e) => { setResponseTime(e.target.value); markDirty(); }}
                placeholder="e.g., Within 24 hours"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {profileDirty && (
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', mr: 1 }}>
                Unsaved changes
              </Typography>
            )}
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveProfile}
              disabled={!profileDirty || isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save Profile'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Quick Links
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button variant="outlined" size="small" href="/my-profile/expertise">
              Manage Expertise
            </Button>
            <Button variant="outlined" size="small" href="/my-profile/services">
              Manage Services
            </Button>
            <Button variant="outlined" size="small" href="/my-profile/reviews">
              View Reviews
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
