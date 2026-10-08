import LegalLayout, { H2 } from '@/app/LegalLayout';

export const metadata = {
  title: 'Terms of Service | Mind Loft',
  description: 'The rules of the road for using Mind Loft.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms of Service | Mind Loft',
    description: 'The rules of the road for using Mind Loft.',
    url: '/terms',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Mind Loft',
    description: 'The rules of the road for using Mind Loft.',
  },
};

export default function TermsPage() {
  return (
    <LegalLayout
      kicker="Legal"
      title="Terms of"
      italic="service"
      updated="July 2026"
    >
      <p>
        These Terms of Service govern your use of Mind Loft. By using the site you agree to be bound by them. If you disagree with any part, please do not use the site.
      </p>

      <H2>The service</H2>
      <p>
        Mind Loft publishes top ten lists drawn from expert rankings and named publications, alongside free quizzes and daily word games. Readers may suggest additions to existing lists and submit their own lists, and players may optionally claim a display name to appear on quiz leaderboards. The service is provided free of charge.
      </p>

      <H2>Submissions and user content</H2>
      <p>
        When you submit a list or add an entry, you grant Mind Loft a non-exclusive, royalty-free, worldwide license to display, modify, and distribute that content on the site. You retain ownership of what you submit.
      </p>
      <p>
        By submitting, you confirm that you have the right to do so, that the content does not infringe anyone's copyright, trademark, or other rights, and that it does not contain anything illegal, defamatory, harassing, sexually explicit, hateful, or otherwise objectionable.
      </p>
      <p>
        Submitted lists are reviewed before being published. We reserve the right to refuse, edit, or remove any submission at our discretion, without explanation.
      </p>

      <H2>Prohibited conduct</H2>
      <p>
        You agree not to attempt to manipulate the site through bots, scripts, multiple identities, or any other automated submission or leaderboard-manipulation scheme. You agree not to interfere with the operation of the site, attempt to access it in unauthorized ways, or use it for any illegal purpose.
      </p>

      <H2>Affiliate links</H2>
      <p>
        Many outbound links on the site are affiliate links, meaning we may earn a commission when you click and complete a purchase at the destination merchant. As an Amazon Associate, Mind Loft earns from qualifying purchases. Our editorial choices are not driven by commission rates; we link to merchants where commerce makes sense for the kind of list you are reading.
      </p>
      <p>
        See the full <a href="/disclosure" style={{ color: 'inherit', textDecoration: 'underline' }}>Affiliate Disclosure</a> for more detail.
      </p>

      <H2>No warranty</H2>
      <p>
        The site is provided "as is" without warranty of any kind. Rankings are opinions and entertainment; nothing on this site is professional advice. We do not guarantee accuracy, completeness, currentness, or fitness for any particular purpose. Use of the site is at your own risk.
      </p>

      <H2>Limitation of liability</H2>
      <p>
        To the maximum extent permitted by law, Mind Loft and its operators will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, arising from your use of the site.
      </p>

      <H2>Third-party services</H2>
      <p>
        Links to third-party websites are provided for convenience. We are not responsible for the content, accuracy, or practices of third-party sites. Their use is subject to their own terms.
      </p>

      <H2>Changes to the terms</H2>
      <p>
        We may revise these terms from time to time. Continued use of the site after a revision constitutes acceptance of the updated terms.
      </p>

      <H2>Governing law</H2>
      <p>
        These terms are governed by the laws of <strong>the United States</strong>, without regard to its conflict of laws provisions.
      </p>

      <H2>Contact</H2>
      <p>
        Questions about these terms can be sent to <a href="mailto:admin@mindloftdaily.com" style={{ color: 'inherit' }}><strong>admin@mindloftdaily.com</strong></a>.
      </p>
    </LegalLayout>
  );
}
