// /atlantic-games-alternative (owner, 2026-11-28). Content: lib/alternatives.js; body: app/alternatives/alt-page.js.
import { AltPage, altMetadata } from '../alternatives/alt-page';

export const metadata = altMetadata('atlantic-games-alternative');

export default function Page() {
  return <AltPage slug="atlantic-games-alternative" />;
}
