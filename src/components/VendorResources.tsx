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
    icon: '📖',
    title: 'Vending rules & guides',
    sub: 'Agency page — DSNY enforcement guides, 12 languages',
    href: 'https://www.nyc.gov/site/dsny/what-we-do/cleaning/street-vending-enforcement.page',
  },
  {
    icon: '⚖️',
    title: 'Know your rights & get help',
    sub: 'Street Vendor Project — advocacy and clinics',
    href: 'https://streetvendor.org/',
  },
  {
    icon: '☎️',
    title: 'Report a problem or ask',
    sub: 'NYC 311',
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
      <h4 className="res-heading">For vendors</h4>
      <p className="res-sublabel">Agency pages for licensing and background — this map is the place to check where you can vend.</p>
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
      <p className="res-foot">A guide, not a legal guarantee — confirm with 311 or the agency before you set up.</p>
    </section>
  );
}
