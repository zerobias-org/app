'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import { Storefront as StorefrontIcon } from '@mui/icons-material';
import { UserProfileDropdown } from './UserProfileDropdown';
import Link from 'next/link';

interface AppTopBarProps {
  // Navigation tabs can be added later
}

export function AppTopBar({}: AppTopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'primary.main',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* Left side: Logo and App Name */}
        <Box
          onClick={handleLogoClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.9,
            },
          }}
        >
          {/* App Icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'primary.main' : 'rgba(255,255,255,0.2)',
            }}
          >
            <StorefrontIcon
              sx={{
                fontSize: 24,
                color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'inherit',
              }}
            />
          </Box>

          {/* App Name */}
          <Box>
            <Typography
              variant="h6"
              component="div"
              fontWeight={600}
              sx={{
                color: theme.palette.mode === 'dark' ? 'text.primary' : 'primary.contrastText',
                lineHeight: 1.2,
              }}
            >
              SME Mart
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.mode === 'dark' ? 'text.secondary' : 'rgba(255,255,255,0.8)',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              Compliance Expert Marketplace
            </Typography>
          </Box>
        </Box>

        {/* Center: Navigation */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
          }}
        >
          {[
            { href: '/providers', label: 'Providers' },
            { href: '/services', label: 'Services' },
            { href: '/requests', label: 'Requests' },
          ].map((nav) => (
            <Button
              key={nav.href}
              component={Link}
              href={nav.href}
              sx={{
                color: theme.palette.mode === 'dark' ? 'text.primary' : 'primary.contrastText',
                fontWeight: pathname === nav.href ? 700 : 400,
                borderBottom: pathname === nav.href ? '2px solid currentColor' : '2px solid transparent',
                borderRadius: 0,
                px: 2,
              }}
            >
              {nav.label}
            </Button>
          ))}
        </Box>

        {/* Right side: User Profile Dropdown */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            color: theme.palette.mode === 'dark' ? 'text.primary' : 'primary.contrastText',
          }}
        >
          <UserProfileDropdown />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
