'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  Drawer,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  IconButton,
} from '@mui/material';
import {
  SwitchAccount as SwitchIcon,
  Close as CloseIcon,
  PersonOff as StopIcon,
} from '@mui/icons-material';
import { useZeroBias } from '@/context/ZeroBiasContext';

interface ProviderSummary {
  id: string;
  zerobiasUserId: string;
  displayName: string;
  headline: string | null;
  availabilityStatus: string;
  hourlyRate: string | null;
}

const IS_LOCAL_DEV = process.env.NEXT_PUBLIC_IS_LOCAL_DEV === 'true';

export function ImpersonationSwitcher() {
  const { user, isImpersonating, impersonateUser, stopImpersonating } = useZeroBias();
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);

  useEffect(() => {
    if (open && providers.length === 0) {
      fetch('/api/providers')
        .then((res) => res.json())
        .then((data) => setProviders(data))
        .catch((err) => console.error('Failed to fetch providers:', err));
    }
  }, [open, providers.length]);

  if (!IS_LOCAL_DEV) return null;

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Floating action button */}
      <Fab
        size="small"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1300,
          bgcolor: isImpersonating ? 'warning.main' : 'grey.700',
          color: 'white',
          '&:hover': { bgcolor: isImpersonating ? 'warning.dark' : 'grey.900' },
        }}
      >
        <SwitchIcon />
      </Fab>

      {/* Impersonation banner */}
      {isImpersonating && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 60,
            right: 16,
            zIndex: 1300,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            px: 2,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          Impersonating: {user?.displayName}
        </Box>
      )}

      {/* Drawer with provider list */}
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 360, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Impersonate User
            </Typography>
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            DEV ONLY — Switch user context to demo different personas.
          </Typography>

          {isImpersonating && (
            <Button
              fullWidth
              variant="outlined"
              color="warning"
              startIcon={<StopIcon />}
              onClick={() => { stopImpersonating(); setOpen(false); }}
              sx={{ mb: 2 }}
            >
              Stop Impersonating
            </Button>
          )}

          <Divider sx={{ mb: 1 }} />

          <List disablePadding>
            {providers.map((provider) => {
              const isActive = user?.id === provider.zerobiasUserId;
              return (
                <ListItemButton
                  key={provider.id}
                  selected={isActive}
                  onClick={() => {
                    impersonateUser(provider.zerobiasUserId, provider.displayName);
                    setOpen(false);
                  }}
                  sx={{ borderRadius: 1, mb: 0.5 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: isActive ? 'primary.main' : 'grey.400', width: 36, height: 36, fontSize: '0.85rem' }}>
                      {initials(provider.displayName)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={provider.displayName}
                    secondary={provider.headline}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }}
                  />
                  {provider.hourlyRate && (
                    <Chip label={`$${provider.hourlyRate}/hr`} size="small" sx={{ ml: 1 }} />
                  )}
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
