import LegalLayout, { H2 } from '@/app/LegalLayout';

export const metadata = {
  title: 'Privacy Policy | Mind Loft',
  description: 'How Mind Loft collects and uses information.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy | Mind Loft',
    description: 'How Mind Loft collects and uses information.',
    url: '/privacy',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Mind Loft',
    description: 'How Mind Loft collects and uses information.',
  },
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      kicker="Legal"
      title="Privacy"
      italic="policy"
      updated="July 2026"
    >
      <p>
        This Privacy Policy describes how Mind Loft ("we", "us", "the site") collects and uses information when you visit. We aim to keep things simple and to collect only what we need to operate the site.
      </p>

      <H2>What we collect</H2>
      <p>
        <strong>Quiz and game results.</strong> When you finish a quiz or one of our daily puzzles, we store the result &mdash; which quiz or puzzle it was, your score, guesses and time, whether you played on a mobile device, and the page you arrived from. Results are tied to a random anonymous identifier generated in your browser, not to your name, unless you have joined a leaderboard.
      </p>
      <p>
        <strong>Leaderboard names.</strong> Joining a leaderboard is optional. If you join, we store the display name you choose and, if you provide one, an email address used only to recover your name on another device. Emails are never displayed publicly and are not used for marketing.
      </p>
      <p>
        <strong>List submissions.</strong> When you submit a list or suggest an addition to one, we store that submission. It is tied to no personal identifier other than the IP address recorded in our server logs.
      </p>
      <p>
        <strong>Local storage in your browser.</strong> We use your browser's local storage to remember game progress, streaks, past results, and the random anonymous identifier above. This data stays on your device except when a finished score is posted as described above.
      </p>
      <p>
        <strong>Server logs.</strong> Our hosting provider (Vercel) records standard request logs including IP addresses, timestamps, requested URLs, and user agents. These logs are used for debugging and abuse prevention. They are retained according to Vercel's policy.
      </p>
      <p>
        <strong>Cookies.</strong> We set one first-party cookie containing a random identifier, used only to count how many distinct browsers visit the site. It contains no personal information, is not shared with anyone, and does not follow you across other websites. Site administrators additionally receive an authentication cookie, which is not relevant to ordinary visitors. We do not use third-party advertising or tracking cookies.
      </p>

      <H2>Third parties</H2>
      <p>
        <strong>Supabase</strong> hosts our database. Quiz results, leaderboard names, and list submissions are stored there. See their privacy policy at supabase.com/privacy.
      </p>
      <p>
        <strong>Vercel</strong> hosts the site. See vercel.com/legal/privacy-policy.
      </p>
      <p>
        <strong>Google Fonts</strong> serves our typography. Requests to fonts.googleapis.com include standard request metadata. See policies.google.com/privacy.
      </p>
      <p>
        <strong>Amazon Associates and other affiliate networks.</strong> Outbound links to merchants may include affiliate identifiers that allow us to receive a commission on qualifying purchases. When you click such a link, the merchant may set its own cookies and collect its own data per its own privacy policy. We do not share any of your data with these networks beyond the click itself.
      </p>

      <H2>What we don't do</H2>
      <p>
        We do not sell your data. We do not run advertising trackers. We do not build advertising profiles of individual visitors. You never need an account: lists, quizzes, and games all work without signing up, and leaderboard names are optional.
      </p>

      <H2>Your rights</H2>
      <p>
        If you joined a leaderboard and want your name or scores removed, if you submitted a list and want it removed, or if you would like to know what we have stored that relates to you, contact us at the email address below. We will respond within a reasonable time.
      </p>

      <H2>Children</H2>
      <p>
        Most of Mind Loft &mdash; the lists, quizzes, and daily puzzles &mdash; is written for a general audience. Our Kids Corner offers games designed for children: they require no sign-up, ask for no name, email, or other personal information, and progress is stored only on the device. We do not knowingly collect personal information from children under 13 anywhere on the site, and leaderboard sign-up is intended for users 13 and older. If you believe a child under 13 has provided us personal information, please contact us and we will delete it.
      </p>

      <H2>Changes to this policy</H2>
      <p>
        We may update this policy from time to time. The date at the top reflects the most recent change. Substantial changes will be announced on the home page.
      </p>

      <H2>Contact</H2>
      <p>
        Questions about this policy can be sent to <a href="mailto:admin@mindloftdaily.com" style={{ color: 'inherit' }}><strong>admin@mindloftdaily.com</strong></a>.
      </p>
    </LegalLayout>
  );
}
