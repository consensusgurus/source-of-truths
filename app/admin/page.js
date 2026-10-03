import { isAdmin } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

// THE PAGE IS A SHELL (2026-10-02). It checks the cookie and renders the desk
// with no data; the desk then asks /api/admin/data for each part it needs.
//
// It used to build every tab's data here and pass it down as props. Measured on
// the live site that day: 10.0s to first byte and an 18 MB response, most of it
// the full player tables rendered into HTML for a tab that shows ten rows of
// them. The builders moved, unchanged, to lib/admin-data.js; read the header
// there before adding anything back to this file.

export const metadata = {
  title: 'Editor\'s Desk | Mind Loft',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!isAdmin()) {
    redirect('/admin/login');
  }
  return <AdminClient />;
}
