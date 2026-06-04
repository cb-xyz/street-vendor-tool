/**
 * Display catalog for the two-level vendor configuration UI. This is presentation metadata
 * ONLY — the legal logic lives in the engine. Level 1 = vendor type, Level 2 = license sub-type.
 */
import type { Borough, LicenseSubType, VendorType } from '../engine/types';

export interface LicenseOption {
  id: LicenseSubType;
  title: string;
  desc: string;
  chip?: { tone: 'blue' | 'yellow' | 'green'; label: string };
  /** This license needs the vendor to pick a borough (food borough-specific permit). */
  needsBorough?: boolean;
  /** This license needs the vendor to pick a Green Cart precinct. */
  needsPrecinct?: boolean;
}

export interface VendorTypeOption {
  id: VendorType;
  emoji: string;
  title: string;
  desc: string;
  licenses: LicenseOption[];
}

export const VENDOR_CATALOG: VendorTypeOption[] = [
  {
    id: 'food',
    emoji: '🌭',
    title: 'Food Vendor',
    desc: 'Licensed by the Department of Health and Mental Hygiene',
    licenses: [
      { id: 'citywide', title: 'Citywide Permit', desc: 'All five boroughs, year-round' },
      {
        id: 'borough',
        title: 'Borough-Specific Permit',
        desc: 'One borough, excluding Manhattan',
        chip: { tone: 'yellow', label: 'Borough' },
        needsBorough: true,
      },
      {
        id: 'greenCart',
        title: 'Green Cart Permit',
        desc: 'Fresh produce only, in your assigned precinct',
        chip: { tone: 'green', label: 'Green Cart' },
        needsPrecinct: true,
      },
      { id: 'seasonal', title: 'Seasonal Permit', desc: 'Valid April 1 – October 31' },
    ],
  },
  {
    id: 'merch',
    emoji: '🧢',
    title: 'General Vendor',
    desc: 'Licensed by the Department of Consumer and Worker Protection',
    licenses: [
      {
        id: 'standard',
        title: 'Standard License',
        desc: 'Most areas; not permitted in C4/C5/C6 zones or the Midtown Core',
      },
      {
        id: 'yellow',
        title: 'Specialized License — Citywide',
        desc: 'Disabled veterans; valid citywide, including commercial zones',
        chip: { tone: 'yellow', label: 'Yellow' },
      },
      {
        id: 'blue',
        title: 'Specialized License — Midtown Core',
        desc: 'Disabled veterans; required to vend in the Midtown Core',
        chip: { tone: 'blue', label: 'Blue' },
      },
    ],
  },
  {
    id: 'firstAmendment',
    emoji: '📚',
    title: 'First Amendment Vendor',
    desc: 'Books, art, and written matter · No license required',
    licenses: [
      {
        id: 'firstAmendment',
        title: 'First Amendment Vending',
        desc: 'Follows placement rules; treatment in certain zones is pending legal confirmation',
      },
    ],
  },
];

export const OUTER_BOROUGHS: Borough[] = ['Bronx', 'Brooklyn', 'Queens', 'Staten Island'];

export function findVendorType(id: VendorType): VendorTypeOption | undefined {
  return VENDOR_CATALOG.find((v) => v.id === id);
}

export function findLicense(typeId: VendorType, licId: LicenseSubType): LicenseOption | undefined {
  return findVendorType(typeId)?.licenses.find((l) => l.id === licId);
}
