import { BusinessClassification, EMPLOYEE_COUNT_VALUES } from './company-info.model';

export const SECTION_LEGAL_NAME = 'legal_name';
export const SECTION_DBA = 'dba';
export const SECTION_LOGO_URL = 'logo_url';
export const SECTION_SHORT_BLURB = 'short_blurb';
export const SECTION_LONG_DESCRIPTION = 'long_description';
export const SECTION_PRIMARY_CONTACT_USER_ID = 'primary_contact.user_id';
export const SECTION_PRIMARY_CONTACT_NAME = 'primary_contact.name';
export const SECTION_PRIMARY_CONTACT_EMAIL = 'primary_contact.email';
export const SECTION_WEBSITE = 'website';
export const SECTION_HQ_LOCATION_STREET = 'hq_location.street';
export const SECTION_HQ_LOCATION_CITY = 'hq_location.city';
export const SECTION_HQ_LOCATION_STATE = 'hq_location.state';
export const SECTION_HQ_LOCATION_COUNTRY = 'hq_location.country';
export const SECTION_HQ_LOCATION_POSTAL_CODE = 'hq_location.postal_code';
export const SECTION_YEARS_IN_BUSINESS = 'years_in_business';
export const SECTION_EMPLOYEE_COUNT = 'employee_count';
export const SECTION_BUSINESS_CLASSIFICATION = 'business_classification';

// System section — written by Phase 28 save handler, read by Phase 27 routing guard
export const SECTION_ONBOARDING_COMPLETE = 'onboarding_complete';

// Convenience array for iteration
export const USER_FACING_SECTIONS = [
  SECTION_LEGAL_NAME,
  SECTION_DBA,
  SECTION_LOGO_URL,
  SECTION_SHORT_BLURB,
  SECTION_LONG_DESCRIPTION,
  SECTION_PRIMARY_CONTACT_USER_ID,
  SECTION_PRIMARY_CONTACT_NAME,
  SECTION_PRIMARY_CONTACT_EMAIL,
  SECTION_WEBSITE,
  SECTION_HQ_LOCATION_STREET,
  SECTION_HQ_LOCATION_CITY,
  SECTION_HQ_LOCATION_STATE,
  SECTION_HQ_LOCATION_COUNTRY,
  SECTION_HQ_LOCATION_POSTAL_CODE,
  SECTION_YEARS_IN_BUSINESS,
  SECTION_EMPLOYEE_COUNT,
  SECTION_BUSINESS_CLASSIFICATION,
] as const;

/**
 * businessClassification picklist — LOCKED 7 values per D-57
 * Displayed in dropdown; key is the enum value, label is what appears to the user
 */
export const BUSINESS_CLASSIFICATION_OPTIONS = [
  { key: BusinessClassification.NONPROFIT, label: 'Nonprofit / Not-for-profit' },
  { key: BusinessClassification.GOVERNMENT, label: 'Government' },
  { key: BusinessClassification.HOSPITAL_HEALTHCARE, label: 'Hospital/Healthcare Institution' },
  { key: BusinessClassification.PUBLICLY_TRADED, label: 'Publicly-traded Company' },
  { key: BusinessClassification.PE_BACKED, label: 'PE-backed Company' },
  { key: BusinessClassification.PRIVATELY_HELD, label: 'Privately-held Company' },
  { key: BusinessClassification.INDIVIDUAL_SOLE_PROPRIETOR, label: 'Individual / Sole Proprietor' },
] as const;

/**
 * employeeCount picklist — 7 re-banded values per D-57
 */
export const EMPLOYEE_COUNT_OPTIONS = EMPLOYEE_COUNT_VALUES;
