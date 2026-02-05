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
  roles: ProviderRole[];
  skills: ProviderSkill[];
  frameworks: ProviderFramework[];
  products: ProviderProduct[];
  segments: ProviderSegment[];
  serviceSegments: ProviderServiceSegment[];
  serviceOfferings: ServiceOffering[];
  createdAt: string;
  updatedAt: string;
}

export interface ProviderRole {
  id: string;
  providerId: string | null;
  zerobiasRoleId: string;
  isPrimary: boolean | null;
  yearsInRole: number | null;
  createdAt: string;
}

export interface ProviderSkill {
  id: string;
  providerId: string | null;
  zerobiasSkillId: string;
  skillName: string | null;
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert' | null;
  yearsExperience: number | null;
  verified: boolean | null;
  createdAt: string;
}

export interface ProviderFramework {
  id: string;
  providerId: string | null;
  zerobiasFrameworkId: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert' | null;
  yearsExperience: number | null;
  assessorCertified: boolean | null;
  implementationExperience: boolean | null;
  auditExperience: boolean | null;
  createdAt: string;
}

export interface ProviderProduct {
  id: string;
  providerId: string | null;
  zerobiasProductId: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert' | null;
  yearsExperience: number | null;
  certified: boolean | null;
  certificationDetails: string | null;
  createdAt: string;
}

export interface ProviderSegment {
  id: string;
  providerId: string | null;
  zerobiasSegmentId: string;
  isPrimary: boolean | null;
  createdAt: string;
}

export interface ProviderServiceSegment {
  id: string;
  providerId: string | null;
  zerobiasServiceSegmentId: string;
  isPrimary: boolean | null;
  createdAt: string;
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

export interface Review {
  id: string;
  providerId: string | null;
  reviewerZerobiasUserId: string;
  requestId: string | null;
  rating: number;
  reviewText: string | null;
  approved: boolean | null;
  approvedAt: string | null;
  approvedBy: string | null;
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
    mutationFn: async (data: { zerobiasSkillId: string; skillName: string; proficiencyLevel?: string; yearsExperience?: number }) => {
      const res = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: profileQuery.data?.id, ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add skill');
      }
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

  const updateSkill = useMutation({
    mutationFn: async (data: { skillId: string; zerobiasSkillId: string; proficiencyLevel?: string; yearsExperience?: number }) => {
      const res = await fetch('/api/profile/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update skill');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  // =========================================================================
  // ROLES
  // =========================================================================

  const addRole = useMutation({
    mutationFn: async (data: { zerobiasRoleId: string; isPrimary?: boolean; yearsInRole?: number }) => {
      const res = await fetch('/api/profile/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: profileQuery.data?.id, ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add role');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const updateRole = useMutation({
    mutationFn: async (data: { roleId: string; isPrimary?: boolean; yearsInRole?: number }) => {
      const res = await fetch('/api/profile/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, providerId: profileQuery.data?.id }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const deleteRole = useMutation({
    mutationFn: async (roleId: string) => {
      const res = await fetch(`/api/profile/roles?roleId=${roleId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete role');
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

  // Reviews (all, including pending — for moderation)
  const reviewsQuery = useQuery({
    queryKey: ['profile-reviews', profileQuery.data?.id],
    queryFn: async (): Promise<Review[]> => {
      const res = await fetch(`/api/profile/reviews?providerId=${profileQuery.data!.id}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
    enabled: !!profileQuery.data?.id,
  });

  const moderateReview = useMutation({
    mutationFn: async ({ reviewId, approved }: { reviewId: string; approved: boolean }) => {
      const res = await fetch('/api/profile/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, approved, approvedBy: user!.id }),
      });
      if (!res.ok) throw new Error('Failed to moderate review');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-reviews', profileQuery.data?.id] });
    },
  });

  const resetReviewToPending = useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await fetch('/api/profile/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, reset: true }),
      });
      if (!res.ok) throw new Error('Failed to reset review');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-reviews', profileQuery.data?.id] });
    },
  });

  // =========================================================================
  // PRODUCTS
  // =========================================================================

  const addProduct = useMutation({
    mutationFn: async (data: { zerobiasProductId: string; proficiencyLevel?: string; yearsExperience?: number; certified?: boolean; certificationDetails?: string }) => {
      const res = await fetch('/api/profile/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: profileQuery.data?.id, ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add product');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async (data: { productId: string; proficiencyLevel?: string; yearsExperience?: number; certified?: boolean; certificationDetails?: string }) => {
      const res = await fetch('/api/profile/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update product');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(`/api/profile/products?productId=${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  // =========================================================================
  // FRAMEWORKS
  // =========================================================================

  const addFramework = useMutation({
    mutationFn: async (data: { zerobiasFrameworkId: string; proficiencyLevel?: string; yearsExperience?: number; assessorCertified?: boolean; implementationExperience?: boolean; auditExperience?: boolean }) => {
      const res = await fetch('/api/profile/frameworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: profileQuery.data?.id, ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add framework');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const updateFramework = useMutation({
    mutationFn: async (data: { frameworkId: string; proficiencyLevel?: string; yearsExperience?: number; assessorCertified?: boolean; implementationExperience?: boolean; auditExperience?: boolean }) => {
      const res = await fetch('/api/profile/frameworks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update framework');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const deleteFramework = useMutation({
    mutationFn: async (frameworkId: string) => {
      const res = await fetch(`/api/profile/frameworks?frameworkId=${frameworkId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete framework');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  // =========================================================================
  // SEGMENTS
  // =========================================================================

  const addSegment = useMutation({
    mutationFn: async (data: { zerobiasSegmentId: string; isPrimary?: boolean }) => {
      const res = await fetch('/api/profile/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: profileQuery.data?.id, ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add segment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const updateSegment = useMutation({
    mutationFn: async (data: { segmentId: string; isPrimary?: boolean }) => {
      const res = await fetch('/api/profile/segments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, providerId: profileQuery.data?.id }),
      });
      if (!res.ok) throw new Error('Failed to update segment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const deleteSegment = useMutation({
    mutationFn: async (segmentId: string) => {
      const res = await fetch(`/api/profile/segments?segmentId=${segmentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete segment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  // =========================================================================
  // SERVICE SEGMENTS (Professional service categories)
  // =========================================================================

  const addServiceSegment = useMutation({
    mutationFn: async (data: { zerobiasServiceSegmentId: string; isPrimary?: boolean }) => {
      const res = await fetch('/api/profile/service-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: profileQuery.data?.id, ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add service segment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const updateServiceSegment = useMutation({
    mutationFn: async (data: { serviceSegmentId: string; isPrimary?: boolean }) => {
      const res = await fetch('/api/profile/service-segments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, providerId: profileQuery.data?.id }),
      });
      if (!res.ok) throw new Error('Failed to update service segment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const deleteServiceSegment = useMutation({
    mutationFn: async (serviceSegmentId: string) => {
      const res = await fetch(`/api/profile/service-segments?serviceSegmentId=${serviceSegmentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete service segment');
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
    // Roles
    addRole: addRole.mutate,
    isAddingRole: addRole.isPending,
    updateRole: updateRole.mutate,
    isUpdatingRole: updateRole.isPending,
    deleteRole: deleteRole.mutate,
    // Skills
    addSkill: addSkill.mutate,
    isAddingSkill: addSkill.isPending,
    deleteSkill: deleteSkill.mutate,
    updateSkill: updateSkill.mutate,
    isUpdatingSkill: updateSkill.isPending,
    // Products
    addProduct: addProduct.mutate,
    isAddingProduct: addProduct.isPending,
    updateProduct: updateProduct.mutate,
    isUpdatingProduct: updateProduct.isPending,
    deleteProduct: deleteProduct.mutate,
    // Frameworks
    addFramework: addFramework.mutate,
    isAddingFramework: addFramework.isPending,
    updateFramework: updateFramework.mutate,
    isUpdatingFramework: updateFramework.isPending,
    deleteFramework: deleteFramework.mutate,
    // Segments
    addSegment: addSegment.mutate,
    isAddingSegment: addSegment.isPending,
    updateSegment: updateSegment.mutate,
    isUpdatingSegment: updateSegment.isPending,
    deleteSegment: deleteSegment.mutate,
    // Service Segments (professional service categories)
    addServiceSegment: addServiceSegment.mutate,
    isAddingServiceSegment: addServiceSegment.isPending,
    updateServiceSegment: updateServiceSegment.mutate,
    isUpdatingServiceSegment: updateServiceSegment.isPending,
    deleteServiceSegment: deleteServiceSegment.mutate,
    // Services
    addService: addService.mutate,
    isAddingService: addService.isPending,
    updateService: updateService.mutate,
    deleteService: deleteService.mutate,
    // Reviews
    reviews: reviewsQuery.data ?? [],
    reviewsLoading: reviewsQuery.isLoading,
    moderateReview: moderateReview.mutate,
    resetReviewToPending: resetReviewToPending.mutate,
    isModerating: moderateReview.isPending || resetReviewToPending.isPending,
  };
}
