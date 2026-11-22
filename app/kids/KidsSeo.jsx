import { kidsJsonLd } from '@/lib/kids-seo';

// The structured data for a kids page (lib/kids-seo.js). A server component:
// every kids page.js mounts <KidsSeo id="..." /> beside its client.
export default function KidsSeo({ id }) {
  return kidsJsonLd(id).map((d, i) => (
    <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
  ));
}
