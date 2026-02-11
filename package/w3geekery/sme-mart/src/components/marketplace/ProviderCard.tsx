'use client';

import Link from 'next/link';
import { Box, Card, CardContent, Typography, Chip, Avatar } from '@mui/material';

export interface ProviderCardData {
  id: string;
  slug: string;
  displayName: string;
  headline: string | null;
  hourlyRate: string | null;
  ratingAverage: string | null;
  availabilityStatus: string;
  totalJobsCompleted: number;
  skills: { id: string; zerobiasSkillId: string; skillName: string | null; proficiencyLevel: string | null }[];
  serviceOfferings: { id: string; category: string; zerobiasServiceSegmentId?: string | null }[];
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface ProviderCardProps {
  provider: ProviderCardData;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const topSkills = provider.skills.slice(0, 3);
  const primaryCategory = provider.serviceOfferings[0]?.category;

  return (
    <Link href={`/providers/${provider.slug}`} style={{ textDecoration: 'none' }}>
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s',
          height: '100%',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: provider.availabilityStatus === 'available' ? 'primary.main' : 'grey.500',
                fontWeight: 600,
              }}
            >
              {initials(provider.displayName)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {provider.displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {provider.headline || 'Compliance Professional'}
              </Typography>
            </Box>
          </Box>

          {/* Skills */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            {topSkills.map((skill) => (
              <Chip
                key={skill.id}
                label={skill.skillName || skill.zerobiasSkillId}
                size="small"
                variant={skill.proficiencyLevel === 'expert' ? 'filled' : 'outlined'}
                color={skill.proficiencyLevel === 'expert' ? 'primary' : 'default'}
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
          </Box>

          {/* Stats row */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {primaryCategory && (
              <Chip label={primaryCategory} size="small" color="secondary" variant="outlined" />
            )}
            {provider.ratingAverage && (
              <Chip label={`${provider.ratingAverage} Rating`} size="small" />
            )}
            {provider.hourlyRate && (
              <Chip label={`$${provider.hourlyRate}/hr`} size="small" />
            )}
            {provider.availabilityStatus === 'busy' && (
              <Chip label="Busy" size="small" color="warning" />
            )}
          </Box>
        </CardContent>
      </Card>
    </Link>
  );
}
