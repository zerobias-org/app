import { BusinessClassification, EmployeeCountBand } from './company-info.model';

/**
 * Picklists for the company-profile form.
 *
 * This file used to carry the MarketplaceProfileItem `section` constants. Those
 * are gone: OrgProfile stores one row per org with a real column per field, so
 * there are no sections left to name.
 */

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
 * employeeCount picklist — labels verbatim from the smemart 2.0.7 enum.
 * Key is what gets stored on OrgProfile.employeeCount.
 */
export const EMPLOYEE_COUNT_OPTIONS = [
  { key: EmployeeCountBand.BAND_1_10, label: '1-10 employees' },
  { key: EmployeeCountBand.BAND_11_50, label: '11-50 employees' },
  { key: EmployeeCountBand.BAND_51_100, label: '51-100 employees' },
  { key: EmployeeCountBand.BAND_101_500, label: '101-500 employees' },
  { key: EmployeeCountBand.BAND_500_PLUS, label: '500+ employees' },
] as const;
