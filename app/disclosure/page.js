import LegalLayout, { H2 } from '@/app/LegalLayout';

export const metadata = {
  title: 'Affiliate Disclosure | Mind Loft',
  description: 'How Mind Loft makes money through affiliate partnerships.',
  alternates: { canonical: '/disclosure' },
  openGraph: {
    title: 'Affiliate Disclosure | Mind Loft',
    description: 'How Mind Loft makes money through affiliate partnerships.',
    url: '/disclosure',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Affiliate Disclosure | Mind Loft',
    description: 'How Mind Loft makes money through affiliate partnerships.',
  },
};

export default function DisclosurePage() {
  return (
    <LegalLayout
      kicker="Legal"
      title="Affiliate"
      italic="disclosure"
      updated="May 2026"
    >
      <p>
        Mind Loft participates in affiliate marketing programs. This page exists to be transparent about that.
      </p>

      <H2>Amazon Associates</H2>
      <p>
        Mind Loft is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to amazon.com and affiliated sites.
      </p>
      <p>
        <strong>As an Amazon Associate, Mind Loft earns from qualifying purchases.</strong>
      </p>
      <p>
        When you click an Amazon link on this site and make a qualifying purchase within Amazon's tracking window, we receive a small commission. The price you pay is unchanged whether you click through us or go to Amazon directly.
      </p>

      <H2>Other affiliate networks</H2>
      <p>
        Outbound links to certain other merchants and platforms may also be affiliate links. Programs we may use include but are not limited to Booking.com, Tripadvisor, Apple Services Performance Partners, and other networks. Where an outbound link is an affiliate link, we receive a commission only when you complete a qualifying action at the destination.
      </p>

      <H2>What we don't do</H2>
      <p>
        We do not accept payment in exchange for inclusion on a list. We do not allow advertisers to influence rankings. Editorial choices about which lists to publish, and how to order them, are independent of commercial relationships. Affiliate links are added where they make sense for the kind of list a reader is on (Amazon for products, Booking.com for hotels, Google Maps for restaurants, and so on) and not as a result of any payment from those merchants.
      </p>

      <H2>How to spot an affiliate link</H2>
      <p>
        Most outbound links on item rows are affiliate links. Outbound links in the footer, header, or body text are usually not. If you would prefer not to use our affiliate links, you can navigate directly to the destination merchant by typing its address into your browser.
      </p>

      <H2>Questions</H2>
      <p>
        If you have any questions about how the site makes money, contact us at <a href="mailto:admin@mindloftdaily.com" style={{ color: 'inherit' }}><strong>admin@mindloftdaily.com</strong></a>.
      </p>
    </LegalLayout>
  );
}
