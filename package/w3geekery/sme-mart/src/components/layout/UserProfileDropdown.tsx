'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon,
  DarkMode as DarkModeIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  ShoppingCart as BuyerIcon,
  Engineering as ProviderIcon,
  SwapHoriz as BothIcon,
} from '@mui/icons-material';
import { useUserRole, type UserRole } from '@/hooks/useUserRole';

// Detect environment from ZeroBias host
function getEnvironment(): { name: string; color: string } {
  const host = process.env.NEXT_PUBLIC_ZEROBIAS_HOST || '';
  if (host.includes('ci.zerobias') || host.includes('dev.zerobias')) {
    return { name: 'CI', color: '#f59e0b' }; // amber
  }
  if (host.includes('qa.zerobias')) {
    return { name: 'QA', color: '#8b5cf6' }; // purple
  }
  if (host.includes('app.zerobias') || host.includes('zerobias.com')) {
    return { name: 'PROD', color: '#10b981' }; // green
  }
  if (process.env.NEXT_PUBLIC_AUTH_MODE === 'mock') {
    return { name: 'MOCK', color: '#6b7280' }; // gray
  }
  return { name: 'DEV', color: '#3b82f6' }; // blue
}
import { useZeroBias } from '@/context/ZeroBiasContext';
import { useTheme } from '@/context/ThemeContext';

interface UserProfileDropdownProps {
  // Future: isAdmin prop will come from context
}

export function UserProfileDropdown({}: UserProfileDropdownProps) {
  const router = useRouter();
  const { user, org, loading, isAdmin } = useZeroBias();
  const { isDarkMode, toggle: toggleTheme } = useTheme();
  const { role, setRole } = useUserRole();

  const handleRoleChange = (_: React.MouseEvent<HTMLElement>, newRole: UserRole | null) => {
    if (newRole) setRole(newRole);
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEditProfile = () => {
    handleClose();
    router.push('/my-profile');
  };

  const handleAdminClick = () => {
    handleClose();
    router.push('/admin');
  };

  const handleThemeToggle = () => {
    toggleTheme();
    // Don't close menu - let user see the toggle change
  };

  const [devModeDialogOpen, setDevModeDialogOpen] = useState(false);

  const handleLogout = () => {
    handleClose();
    setDevModeDialogOpen(true);
  };

  const handleLogin = () => {
    handleClose();
    setDevModeDialogOpen(true);
  };

  // Get display name and initials
  const displayName = user?.displayName || user?.email || 'Guest';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get environment info
  const env = getEnvironment();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'grey.400' }} />
      </Box>
    );
  }

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: 2,
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: 36 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography component="span" variant="body2" fontWeight={500} sx={{ lineHeight: 1.2, fontSize: '0.8rem' }}>
              {displayName}
            </Typography>
            <Box
              component="span"
              sx={{
                px: 0.5,
                py: 0.1,
                borderRadius: 0.5,
                bgcolor: env.color,
                color: 'white',
                fontSize: '0.55rem',
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {env.name}
            </Box>
          </Box>
          {org && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, fontSize: '0.65rem' }}>
              {org.name}
            </Typography>
          )}
        </Box>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
            fontSize: '0.875rem',
          }}
        >
          {initials}
        </Avatar>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 220,
              mt: 1,
            },
          },
        }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
                fontSize: '0.9rem',
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 40, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography component="span" variant="body2" fontWeight={500} sx={{ lineHeight: 1.2 }}>
                  {displayName}
                </Typography>
                <Box
                  component="span"
                  sx={{
                    px: 0.5,
                    py: 0.1,
                    borderRadius: 0.5,
                    bgcolor: env.color,
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  {env.name}
                </Box>
              </Box>
              {user?.email && (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, fontSize: '0.7rem' }}>
                  {user.email}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        <Divider />

        {user && (
          <MenuItem onClick={handleEditProfile}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Profile</ListItemText>
          </MenuItem>
        )}

        {user && isAdmin && (
          <MenuItem onClick={handleAdminClick}>
            <ListItemIcon>
              <AdminIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>App Administration</ListItemText>
          </MenuItem>
        )}

        {user && <Divider />}

        {/* Role Toggle */}
        {user && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Marketplace Role
            </Typography>
            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={handleRoleChange}
              size="small"
              fullWidth
              sx={{
                '& .MuiToggleButton-root': {
                  py: 0.5,
                  px: 1,
                  fontSize: '0.7rem',
                  textTransform: 'none',
                },
              }}
            >
              <ToggleButton value="buyer">
                <BuyerIcon sx={{ fontSize: 14, mr: 0.5 }} />
                Buyer
              </ToggleButton>
              <ToggleButton value="provider">
                <ProviderIcon sx={{ fontSize: 14, mr: 0.5 }} />
                Provider
              </ToggleButton>
              <ToggleButton value="both">
                <BothIcon sx={{ fontSize: 14, mr: 0.5 }} />
                Both
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {user && <Divider />}

        <MenuItem onClick={handleThemeToggle}>
          <ListItemIcon>
            <DarkModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dark Theme</ListItemText>
          <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
            {isDarkMode ? (
              <ToggleOnIcon color="primary" />
            ) : (
              <ToggleOffIcon color="action" />
            )}
          </Box>
        </MenuItem>

        <Divider />

        {user ? (
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sign Out</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={handleLogin}>
            <ListItemIcon>
              <LoginIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sign In</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Dialog open={devModeDialogOpen} onClose={() => setDevModeDialogOpen(false)}>
        <DialogTitle>Dev Mode</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This is disabled in dev mode. Authentication is handled via proxy API key.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDevModeDialogOpen(false)} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
