// /lumosity-alternative (owner, 2026-11-28). Content: lib/alternatives.js; body: app/alternatives/alt-page.js.
import { AltPage, altMetadata } from '../alternatives/alt-page';

export const metadata = altMetadata('lumosity-alternative');

export default function Page() {
  return <AltPage slug="lumosity-alternative" />;
}
