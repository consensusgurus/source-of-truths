// Every kids page installs as Mind Loft Kids, not the main site. The manifest
// route reads the exact page from the Referer; ?path=/kids is the fallback when a
// browser sends none, so a kids install never lands on the grown-up homepage.
export const metadata = {
  manifest: '/api/pwa-manifest?path=/kids',
};

export default function KidsLayout({ children }) {
  return children;
}
