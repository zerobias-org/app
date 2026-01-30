import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useZeroBias } from '@/context/ZeroBiasContext';

// Types matching Drizzle schema output
export interface ProviderProfile {
  id: string;
  zerobiasUserId: string;
  zerobiasOrgId: string | null;
  displayName: string;
  headline: string | null;
  about: string | null;
  avatarUrl: string | null;
  hourlyRate: string | null;
  availabilityStatus: 'available' | 'busy' | 'unavailable';
  responseTime: string | null;
  totalJobsCompleted: number;
  totalEarnings: string;
  ratingAverage: string | null;
  skills: ProviderSkill[];
  serviceOfferings: ServiceOffering[];
  createdAt: string;
  updatedAt: string;
}

export interface ProviderSkill {
  id: string;
  providerId: string | null;
  skillName: string;
  skillCategory: string | null;
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert' | null;
  yearsExperience: number | null;
  verified: boolean | null;
}

export interface ServiceOffering {
  id: string;
  providerId: string | null;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  pricingType: 'fixed' | 'hourly' | 'subscription' | 'custom';
  price: string | null;
  deliveryTime: string | null;
  includes: string[] | null;
  requirements: string | null;
  isActive: boolean | null;
  createdAt: string;
}

export interface ProfileUpdateData {
  headline?: string | null;
  about?: string | null;
  hourlyRate?: string | null;
  availabilityStatus?: 'available' | 'busy' | 'unavailable';
  responseTime?: string | null;
}

export function useProfile() {
  const { user, org } = useZeroBias();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<ProviderProfile> => {
      const params = new URLSearchParams({
        zerobiasUserId: user!.id,
        displayName: user!.displayName || user!.email,
      });
      if (org?.id) {
        params.set('zerobiasOrgId', org.id);
      }
      const res = await fetch(`/api/profile?${params}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zerobiasUserId: user!.id, ...data }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const addSkill = useMutation({
    mutationFn: async (data: { skillName: string; skillCategory?: string; proficiencyLevel?: string; yearsExperience?: number }) => {
      const res = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: profileQuery.data?.id, ...data }),
      });
      if (!res.ok) throw new Error('Failed to add skill');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const deleteSkill = useMutation({
    mutationFn: async (skillId: string) => {
      const res = await fetch(`/api/profile/skills?skillId=${skillId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete skill');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const addService = useMutation({
    mutationFn: async (data: { title: string; category: string; pricingType: string; description?: string; subcategory?: string; price?: string; deliveryTime?: string; includes?: string[]; requirements?: string }) => {
      const res = await fetch('/api/profile/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: profileQuery.data?.id, ...data }),
      });
      if (!res.ok) throw new Error('Failed to add service');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const updateService = useMutation({
    mutationFn: async (data: { serviceId: string; [key: string]: unknown }) => {
      const res = await fetch('/api/profile/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update service');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const deleteService = useMutation({
    mutationFn: async (serviceId: string) => {
      const res = await fetch(`/api/profile/services?serviceId=${serviceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete service');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  return {
    profile: profileQuery.data ?? null,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
    addSkill: addSkill.mutate,
    isAddingSkill: addSkill.isPending,
    deleteSkill: deleteSkill.mutate,
    addService: addService.mutate,
    isAddingService: addService.isPending,
    updateService: updateService.mutate,
    deleteService: deleteService.mutate,
  };
}
