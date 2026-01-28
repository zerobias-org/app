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
} from '@mui/material';
import {
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon,
  DarkMode as DarkModeIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import { useZeroBias } from '@/context/ZeroBiasContext';
import { useTheme } from '@/context/ThemeContext';

interface UserProfileDropdownProps {
  // Future: isAdmin prop will come from context
}

export function UserProfileDropdown({}: UserProfileDropdownProps) {
  const router = useRouter();
  const { user, org, loading, isAdmin } = useZeroBias();
  const { isDarkMode, toggle: toggleTheme } = useTheme();

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

  const handleLogout = () => {
    handleClose();
    // Redirect to ZeroBias logout
    window.location.href = '/dana/api/v2/me/session/logout';
  };

  const handleLogin = () => {
    handleClose();
    // Redirect to ZeroBias login page
    // Pass current URL as 'next' param to return after login
    const nextUrl = encodeURIComponent(window.location.href);
    window.location.href = `/login/?next=${nextUrl}`;
  };

  // Get display name and initials
  const displayName = user?.displayName || user?.email || 'Guest';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
          <Typography component="span" variant="body2" fontWeight={500} sx={{ lineHeight: 1.2, fontSize: '0.8rem' }}>
            {displayName}
          </Typography>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 40 }}>
              <Typography component="span" variant="body2" fontWeight={500} sx={{ lineHeight: 1.2 }}>
                {displayName}
              </Typography>
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
    </>
  );
}
