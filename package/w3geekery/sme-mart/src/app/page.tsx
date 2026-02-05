'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, Card, CardContent, Grid, CircularProgress, Alert, useTheme, alpha } from '@mui/material';
import { Search, Users, Briefcase, Shield, Cpu, BookOpen } from 'lucide-react';
import { useZeroBias } from '@/context/ZeroBiasContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProviderCard, type ProviderCardData } from '@/components/marketplace/ProviderCard';

const categories = [
  { name: 'Assessors', icon: Shield, description: 'Compliance assessors & auditors' },
  { name: 'Advisors', icon: Briefcase, description: 'GRC consultants & strategists' },
  { name: 'Agentic', icon: Cpu, description: 'AI agent builders & automation' },
  { name: 'SecOps', icon: Users, description: 'Security operations professionals' },
  { name: 'Training', icon: BookOpen, description: 'Compliance training & certification' },
];

export default function Home() {
  const { user, org, loading, error } = useZeroBias();
  const theme = useTheme();
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderCardData[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/providers?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    fetch('/api/providers')
      .then((res) => res.json())
      .then((data) => {
        setProviders(data);
        setProvidersLoading(false);
      })
      .catch(() => setProvidersLoading(false));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom fontWeight={700}>
            SME Mart
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            Marketplace for Compliance Subject Matter Experts
          </Typography>

          {/* Auth Status */}
          <Box sx={{ mb: 4, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.15), borderRadius: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} sx={{ color: 'white' }} />
                <Typography>Connecting to ZeroBias...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="warning" sx={{ bgcolor: alpha(theme.palette.background.paper, 0.9) }}>
                Not authenticated. Some features may be limited.
              </Alert>
            ) : user ? (
              <Typography>
                Welcome, <strong>{user.displayName || user.email}</strong>
                {org && <> | Organization: <strong>{org.displayName || org.name}</strong></>}
              </Typography>
            ) : (
              <Typography>Please sign in to access all features.</Typography>
            )}
          </Box>

          {/* Search */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              maxWidth: 600,
              bgcolor: 'background.paper',
              borderRadius: 2,
              p: 1,
            }}
          >
            <Box
              component="input"
              placeholder="Search for SMEs, skills, or services..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') handleSearch();
              }}
              sx={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '1rem',
                px: 2,
                bgcolor: 'transparent',
                color: 'text.primary',
                '&::placeholder': {
                  color: 'text.secondary',
                  opacity: 1,
                },
              }}
            />
            <Button variant="contained" startIcon={<Search size={20} />} onClick={handleSearch}>
              Search
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Categories */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Browse by Category
        </Typography>
        <Grid container spacing={3}>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.name}>
                <Link href={`/providers?category=${category.name}`} style={{ textDecoration: 'none' }}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'primary.light',
                          color: 'white',
                          display: 'flex',
                        }}
                      >
                        <Icon size={24} />
                      </Box>
                      <Box className="text-compact">
                        <Typography variant="h6">{category.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Link>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* Featured Providers */}
      <Box sx={{ bgcolor: 'grey.100', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Featured Experts
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Top-rated SMEs ready to help with your compliance needs
          </Typography>

          {providersLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : providers.length === 0 ? (
            <Typography color="text.secondary">No providers found.</Typography>
          ) : (
            <>
              <Grid container spacing={3}>
                {providers.map((provider) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={provider.id}>
                    <ProviderCard provider={provider} />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  component={Link}
                  href="/providers"
                  variant="outlined"
                  size="large"
                >
                  Browse All Providers
                </Button>
              </Box>
            </>
          )}
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          SME Mart - A ZeroBias Community Application
        </Typography>
      </Box>
    </Box>
  );
}
