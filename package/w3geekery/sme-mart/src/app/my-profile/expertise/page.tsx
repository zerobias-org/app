'use client';

import {
  Box,
  Typography,
  Grid,
} from '@mui/material';
import {
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Work as WorkIcon,
  Psychology as PsychologyIcon,
  Inventory as InventoryIcon,
  Gavel as GavelIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useProfile } from '@/hooks/useProfile';
import {
  useRoles, useSkills, useProducts, useFrameworks, useSegments, useServiceSegments,
  CatalogProduct,
} from '@/hooks/useZeroBiasCatalog';
import { ProfileExperienceSection, CatalogItem } from '@/components/profile';

export default function ExpertisePage() {
  const {
    profile,
    isLoading: profileLoading,
    addRole, isAddingRole, deleteRole,
    addSkill, isAddingSkill, deleteSkill,
    addProduct, isAddingProduct, deleteProduct,
    addFramework, isAddingFramework, deleteFramework,
    addSegment, isAddingSegment, deleteSegment,
    addServiceSegment, isAddingServiceSegment, deleteServiceSegment,
  } = useProfile();

  // ZeroBias catalog data
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: skillsData, isLoading: skillsLoading } = useSkills();
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { data: frameworksData, isLoading: frameworksLoading } = useFrameworks();
  const { data: segmentsData, isLoading: segmentsLoading } = useSegments();
  const { data: serviceSegmentsData, isLoading: serviceSegmentsLoading } = useServiceSegments();

  // Convert catalog data to CatalogItem format
  const roleCatalogItems: CatalogItem[] = rolesData?.items.map(r => ({
    id: r.id,
    name: r.name,
    code: r.code,
    description: r.description,
    group: r.categoryName,
  })) || [];

  const skillCatalogItems: CatalogItem[] = skillsData?.items.map(s => ({
    id: s.id,
    name: s.name,
    code: s.code,
    description: s.description,
  })) || [];

  const productCatalogItems: CatalogItem[] = productsData?.items.map(p => ({
    id: p.id,
    name: p.name,
    code: p.code,
    description: p.description,
    group: p.vendorName,
  })) || [];

  const frameworkCatalogItems: CatalogItem[] = frameworksData?.items.map(f => ({
    id: f.id,
    name: f.name,
    code: f.code,
    description: f.description,
  })) || [];

  const segmentCatalogItems: CatalogItem[] = segmentsData?.items.map(s => ({
    id: s.id,
    name: s.name,
    code: s.code,
    description: s.description,
  })) || [];

  const serviceSegmentCatalogItems: CatalogItem[] = serviceSegmentsData?.items.map(s => ({
    id: s.id,
    name: s.description || s.name,
    code: s.name,
    description: s.description,
  })) || [];

  // Add handlers - just add with defaults
  const handleAddRole = (catalogItem: CatalogItem) => {
    addRole({ zerobiasRoleId: catalogItem.id });
  };

  const handleAddSkill = (catalogItem: CatalogItem) => {
    addSkill({ zerobiasSkillId: catalogItem.id, skillName: catalogItem.name });
  };

  const handleAddProduct = (catalogItem: CatalogItem) => {
    addProduct({ zerobiasProductId: catalogItem.id });
  };

  const handleAddFramework = (catalogItem: CatalogItem) => {
    addFramework({ zerobiasFrameworkId: catalogItem.id });
  };

  const handleAddSegment = (catalogItem: CatalogItem) => {
    addSegment({ zerobiasSegmentId: catalogItem.id });
  };

  const handleAddServiceSegment = (catalogItem: CatalogItem) => {
    addServiceSegment({ zerobiasServiceSegmentId: catalogItem.id });
  };

  return (
    <Grid container spacing={2}>
      {/* Left Column */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Roles */}
          <ProfileExperienceSection
            title="Role Experience"
            icon={<WorkIcon fontSize="small" />}
            catalogItems={roleCatalogItems}
            items={profile?.roles || []}
            getCatalogId={(item) => item.zerobiasRoleId}
            placeholder="Search NICE work roles..."
            profileLoading={profileLoading}
            catalogLoading={rolesLoading}
            isAdding={isAddingRole}
            onAdd={handleAddRole}
            onDelete={(item) => deleteRole(item.id)}
            renderChipLabel={(item, catalogItem) => catalogItem?.name || item.zerobiasRoleId}
            getChipProps={(item) => ({
              color: item.isPrimary ? 'primary' : 'default',
              variant: item.isPrimary ? 'filled' : 'outlined',
              icon: item.isPrimary ? <StarIcon fontSize="small" /> : undefined,
            })}
          />

          {/* Skills */}
          <ProfileExperienceSection
            title="Skills & Expertise"
            icon={<PsychologyIcon fontSize="small" />}
            catalogItems={skillCatalogItems}
            items={profile?.skills || []}
            getCatalogId={(item) => item.zerobiasSkillId}
            placeholder="Search NICE skills..."
            profileLoading={profileLoading}
            catalogLoading={skillsLoading}
            isAdding={isAddingSkill}
            onAdd={handleAddSkill}
            onDelete={(item) => deleteSkill(item.id)}
            renderChipLabel={(item, catalogItem) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {catalogItem?.name || item.zerobiasSkillId}
                {catalogItem?.code && (
                  <Typography variant="caption" sx={{ opacity: 0.5 }}>
                    ({catalogItem.code})
                  </Typography>
                )}
              </Box>
            )}
            getChipProps={(item) => ({
              color: item.proficiencyLevel === 'expert' ? 'primary' : 'default',
              variant: item.proficiencyLevel === 'expert' ? 'filled' : 'outlined',
            })}
          />

          {/* Products */}
          <ProfileExperienceSection
            title="Product Experience"
            icon={<InventoryIcon fontSize="small" />}
            catalogItems={productCatalogItems}
            items={profile?.products || []}
            getCatalogId={(item) => item.zerobiasProductId}
            placeholder="Search products..."
            profileLoading={profileLoading}
            catalogLoading={productsLoading}
            isAdding={isAddingProduct}
            onAdd={handleAddProduct}
            onDelete={(item) => deleteProduct(item.id)}
            renderChipLabel={(item, catalogItem) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {catalogItem?.name || item.zerobiasProductId}
                {(catalogItem as CatalogProduct | undefined)?.vendorName && (
                  <Typography variant="caption" sx={{ opacity: 0.5 }}>
                    ({(catalogItem as CatalogProduct).vendorName})
                  </Typography>
                )}
              </Box>
            )}
            getChipProps={(item) => ({
              color: item.certified ? 'success' : 'default',
              variant: item.certified ? 'filled' : 'outlined',
              icon: item.certified ? <CheckCircleIcon fontSize="small" /> : undefined,
            })}
          />
        </Box>
      </Grid>

      {/* Right Column */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Frameworks */}
          <ProfileExperienceSection
            title="Framework Experience"
            icon={<GavelIcon fontSize="small" />}
            catalogItems={frameworkCatalogItems}
            items={profile?.frameworks || []}
            getCatalogId={(item) => item.zerobiasFrameworkId}
            placeholder="Search frameworks (SOC 2, ISO 27001, HIPAA...)"
            profileLoading={profileLoading}
            catalogLoading={frameworksLoading}
            isAdding={isAddingFramework}
            onAdd={handleAddFramework}
            onDelete={(item) => deleteFramework(item.id)}
            renderChipLabel={(item, catalogItem) => catalogItem?.name || item.zerobiasFrameworkId}
            getChipProps={(item) => ({
              color: item.assessorCertified ? 'success' : 'default',
              variant: item.assessorCertified ? 'filled' : 'outlined',
              icon: item.assessorCertified ? <CheckCircleIcon fontSize="small" /> : undefined,
            })}
          />

          {/* Service Categories */}
          <ProfileExperienceSection
            title="Service Categories"
            icon={<CategoryIcon fontSize="small" />}
            catalogItems={serviceSegmentCatalogItems}
            items={profile?.serviceSegments || []}
            getCatalogId={(item) => item.zerobiasServiceSegmentId}
            placeholder="Search service categories..."
            profileLoading={profileLoading}
            catalogLoading={serviceSegmentsLoading}
            isAdding={isAddingServiceSegment}
            onAdd={handleAddServiceSegment}
            onDelete={(item) => deleteServiceSegment(item.id)}
            renderChipLabel={(item, catalogItem) => catalogItem?.name || item.zerobiasServiceSegmentId}
            getChipProps={(item) => ({
              color: item.isPrimary ? 'primary' : 'default',
              variant: item.isPrimary ? 'filled' : 'outlined',
              icon: item.isPrimary ? <StarIcon fontSize="small" /> : undefined,
            })}
          />

          {/* Market Segments */}
          <ProfileExperienceSection
            title="Market Segment Experience"
            icon={<BusinessIcon fontSize="small" />}
            catalogItems={segmentCatalogItems}
            items={profile?.segments || []}
            getCatalogId={(item) => item.zerobiasSegmentId}
            placeholder="Search market segments..."
            profileLoading={profileLoading}
            catalogLoading={segmentsLoading}
            isAdding={isAddingSegment}
            onAdd={handleAddSegment}
            onDelete={(item) => deleteSegment(item.id)}
            renderChipLabel={(item, catalogItem) => catalogItem?.name || item.zerobiasSegmentId}
            getChipProps={(item) => ({
              color: item.isPrimary ? 'primary' : 'default',
              variant: item.isPrimary ? 'filled' : 'outlined',
              icon: item.isPrimary ? <StarIcon fontSize="small" /> : undefined,
            })}
          />
        </Box>
      </Grid>
    </Grid>
  );
}
