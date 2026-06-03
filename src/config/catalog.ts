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
    title: 'Food vendor',
    desc: 'Carts & trucks — licensed by the Health Dept (DOHMH)',
    licenses: [
      { id: 'citywide', title: 'Citywide permit', desc: 'All 5 boroughs, year-round' },
      {
        id: 'borough',
        title: 'Borough-specific permit',
        desc: 'One outer borough — not Manhattan',
        chip: { tone: 'yellow', label: 'Outer-boro' },
        needsBorough: true,
      },
      {
        id: 'greenCart',
        title: 'Green Cart permit',
        desc: 'Produce only, in your assigned precinct',
        chip: { tone: 'green', label: 'Green Cart' },
        needsPrecinct: true,
      },
      { id: 'seasonal', title: 'Seasonal permit', desc: 'April 1 – October 31 only' },
    ],
  },
  {
    id: 'merch',
    emoji: '🧢',
    title: 'Merchandise vendor',
    desc: 'Clothing, art, goods — licensed by DCWP',
    licenses: [
      { id: 'standard', title: 'Standard license (White)', desc: 'Cannot use C4/C5/C6 zones or Midtown Core' },
      {
        id: 'yellow',
        title: 'Specialized (Yellow)',
        desc: 'Disabled veterans — citywide incl. commercial zones',
        chip: { tone: 'yellow', label: 'Yellow' },
      },
      {
        id: 'blue',
        title: 'Specialized (Blue)',
        desc: 'Disabled veterans — required for Midtown Core',
        chip: { tone: 'blue', label: 'Blue' },
      },
    ],
  },
  {
    id: 'firstAmendment',
    emoji: '📚',
    title: 'First Amendment vendor',
    desc: 'Books, art, prints — no license needed',
    licenses: [
      {
        id: 'firstAmendment',
        title: 'First Amendment goods',
        desc: 'Follows general placement rules — some zones pending legal confirmation',
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
