'use client';

import Link from 'next/link';
import { Box, Card, CardContent, Typography, Chip, Avatar } from '@mui/material';

export interface ServiceCardData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  pricingType: 'fixed' | 'hourly' | 'subscription' | 'custom';
  price: string | null;
  deliveryTime: string | null;
  provider: {
    id: string;
    slug: string;
    displayName: string;
    ratingAverage: string | null;
    availabilityStatus: string;
  };
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const PRICING_LABELS: Record<string, string> = {
  fixed: 'Fixed Price',
  hourly: 'Hourly',
  subscription: 'Subscription',
  custom: 'Custom',
};

interface ServiceCardProps {
  service: ServiceCardData;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const { provider } = service;

  return (
    <Link href={`/providers/${provider.slug}`} style={{ textDecoration: 'none' }}>
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
        }}
      >
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Title & Category */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {service.title}
            </Typography>
            <Chip label={service.category} size="small" color="secondary" variant="outlined" />
          </Box>

          {/* Description */}
          {service.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {service.description}
            </Typography>
          )}

          {/* Pricing */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {service.price && (
              <Chip
                label={`$${service.price}${service.pricingType === 'hourly' ? '/hr' : ''}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            <Chip label={PRICING_LABELS[service.pricingType] || service.pricingType} size="small" />
            {service.deliveryTime && (
              <Chip label={service.deliveryTime} size="small" variant="outlined" />
            )}
          </Box>

          {/* Provider */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.8rem',
                bgcolor: provider.availabilityStatus === 'available' ? 'primary.main' : 'grey.500',
              }}
            >
              {initials(provider.displayName)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={500} noWrap>
                {provider.displayName}
              </Typography>
              {provider.ratingAverage && (
                <Typography variant="caption" color="text.secondary">
                  {provider.ratingAverage} rating
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Link>
  );
}
