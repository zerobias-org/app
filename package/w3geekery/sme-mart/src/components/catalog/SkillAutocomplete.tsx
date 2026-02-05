'use client';

/**
 * SkillAutocomplete
 *
 * Autocomplete for selecting NICE Skills.
 */

import { useSkills, CatalogSkill } from '@/hooks/useZeroBiasCatalog';
import CatalogAutocomplete from './CatalogAutocomplete';

interface SkillAutocompleteProps {
  value: CatalogSkill | null;
  onChange: (value: CatalogSkill | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export default function SkillAutocomplete({
  value,
  onChange,
  label = 'Skill',
  placeholder = 'Search skills...',
  disabled = false,
  error = false,
  helperText,
}: SkillAutocompleteProps) {
  const { data: skillsData, isLoading } = useSkills();

  return (
    <CatalogAutocomplete<CatalogSkill>
      items={skillsData?.items || []}
      loading={isLoading}
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      helperText={helperText}
      showCode={true}
    />
  );
}
