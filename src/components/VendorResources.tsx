/**
 * Always-visible help panel for vendors — shown under the map before and after any map click.
 * The goal (per SBS): a genuinely useful one-stop set of links and reminders for vending legally.
 */
import type { VendorType } from '../engine/types';

interface ResourceLink {
  icon: string;
  title: string;
  sub: string;
  href: string;
}

const COMMON: ResourceLink[] = [
  {
    icon: '📍',
    title: 'Official City vending maps & guides',
    sub: 'DSNY — General Vendor & Mobile Food maps, plus guides in 12 languages',
    href: 'https://www.nyc.gov/site/dsny/what-we-do/cleaning/street-vending-enforcement.page',
  },
  {
    icon: '⚖️',
    title: 'Know your rights & free help',
    sub: 'The Street Vendor Project — advocacy, clinics, and vendor support',
    href: 'https://streetvendor.org/',
  },
  {
    icon: '☎️',
    title: 'Questions about a specific spot?',
    sub: 'Check with NYC 311',
    href: 'https://portal.311.nyc.gov/article/?kanumber=KA-02152',
  },
];

const APPLY: Record<VendorType, ResourceLink> = {
  food: {
    icon: '📝',
    title: 'Apply for / renew a food vending permit',
    sub: 'DOHMH — Mobile Food Vendor licensing',
    href: 'https://www.nyc.gov/site/doh/business/food-operators/mobile-and-temporary-food-vendors.page',
  },
  merch: {
    icon: '📝',
    title: 'Apply for / renew a vendor license',
    sub: 'DCWP — General Vendor license checklist',
    href: 'https://www.nyc.gov/site/dca/businesses/license-checklist-general-vendor.page',
  },
  firstAmendment: {
    icon: '📚',
    title: 'First Amendment vending — no license needed',
    sub: 'You still follow placement rules. See the Street Vendor Project for guidance.',
    href: 'https://streetvendor.org/',
  },
};

export function VendorResources({ vendorType }: { vendorType: VendorType }) {
  const links = [APPLY[vendorType], ...COMMON];
  return (
    <section className="res-links" aria-label="Vendor resources">
      <h4 className="res-heading">Helpful links & info for vendors</h4>
      {links.map((l) => (
        <a key={l.href + l.title} href={l.href} target="_blank" rel="noopener">
          <span>{l.icon}</span>
          <span>
            {l.title}
            <small>{l.sub}</small>
          </span>
          <span className="arr">↗</span>
        </a>
      ))}
      <p className="res-foot">
        This tool is a guide, not a legal guarantee. Rules change and some spots need judgment —
        always confirm with 311 or the agency before you set up.
      </p>
    </section>
  );
}
