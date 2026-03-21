import { Link } from "react-router-dom";

const LAST_UPDATED = "21 March 2026";
const CONTACT_EMAIL = "privacy@provenai.app";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <span>← Back to Proven AI</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex justify-center p-4 py-10">
        <div className="w-full max-w-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-10 overflow-hidden h-[9.375rem]">
            <img
              src="/PROVEN%20AI%20MAIN6.png"
              alt="Proven AI"
              className="h-[16.875rem] w-auto -translate-y-14"
              width="1500"
              height="1050"
              loading="eager"
            />
          </div>

          {/* Content */}
          <div className="space-y-10">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
              <p className="text-muted-foreground">
                This policy explains what data ProvenAI collects, why we collect it, and
                what rights you have. We've written it in plain English — no legal jargon.
              </p>
            </div>

            <Section title="Who we are">
              <p>
                ProvenAI is a membership community for professionals who want to learn and
                use AI effectively. Our website is{" "}
                <a href="https://provenai.app" className="text-primary hover:underline">
                  provenai.app
                </a>
                . For any privacy-related questions, contact us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </Section>

            <Section title="What data we collect">
              <ul className="space-y-3">
                <Li>
                  <strong>Email address and name</strong> — when you sign up for our
                  waitlist, newsletter, or membership.
                </Li>
                <Li>
                  <strong>Account information</strong> — email and password (hashed) when
                  you create a member account.
                </Li>
                <Li>
                  <strong>Usage data</strong> — pages visited, content opened, and features
                  used inside the platform. This helps us understand what's useful.
                </Li>
                <Li>
                  <strong>Email engagement data</strong> — whether you opened an email or
                  clicked a link (via tracking pixels). You can opt out by disabling images
                  in your email client.
                </Li>
                <Li>
                  <strong>Payment information</strong> — handled entirely by our payment
                  processor (Stripe). We never store your card details.
                </Li>
              </ul>
            </Section>

            <Section title="Why we collect it">
              <ul className="space-y-3">
                <Li>To send you relevant content, product updates, and member communications.</Li>
                <Li>To provide and improve the ProvenAI platform.</Li>
                <Li>To process your membership and payments.</Li>
                <Li>
                  To understand what content is most useful so we can make ProvenAI better.
                </Li>
                <Li>To comply with legal obligations.</Li>
              </ul>
              <p className="mt-4">
                We don't sell your data. We don't use it for advertising. We collect only
                what we need to run ProvenAI well.
              </p>
            </Section>

            <Section title="Who we share it with">
              <p className="mb-4">
                We share data with a small number of trusted services that help us run
                ProvenAI:
              </p>
              <ul className="space-y-3">
                <Li>
                  <strong>AWS SES</strong> — used to send transactional and marketing
                  emails. Your email address is shared for delivery purposes.
                </Li>
                <Li>
                  <strong>Cloudflare</strong> — provides hosting, DNS, and security for our
                  website. Traffic passes through their network.
                </Li>
                <Li>
                  <strong>Stripe</strong> — payment processing. Stripe handles all card
                  data and is PCI-DSS compliant.
                </Li>
                <Li>
                  <strong>Cloudflare D1</strong> — our database provider. Your account
                  data is stored here.
                </Li>
              </ul>
              <p className="mt-4">
                All third-party providers are contractually required to handle your data
                securely and only for the purposes we specify.
              </p>
            </Section>

            <Section title="Cookies and tracking">
              <p className="mb-4">Our website uses the following:</p>
              <ul className="space-y-3">
                <Li>
                  <strong>Session cookies</strong> — to keep you logged in while using
                  ProvenAI. These are strictly necessary.
                </Li>
                <Li>
                  <strong>Email tracking pixels</strong> — small images embedded in our
                  emails that tell us when an email was opened. You can disable these by
                  turning off automatic image loading in your email client.
                </Li>
              </ul>
              <p className="mt-4">
                We don't use third-party advertising cookies or tracking scripts.
              </p>
            </Section>

            <Section title="Your rights (GDPR)">
              <p className="mb-4">
                If you're based in the EU or UK, you have the following rights under GDPR:
              </p>
              <ul className="space-y-3">
                <Li>
                  <strong>Access</strong> — you can request a copy of the data we hold
                  about you.
                </Li>
                <Li>
                  <strong>Correction</strong> — you can ask us to update any inaccurate
                  data.
                </Li>
                <Li>
                  <strong>Deletion</strong> — you can ask us to delete your account and all
                  associated data.
                </Li>
                <Li>
                  <strong>Unsubscribe</strong> — every email we send includes an unsubscribe
                  link. You can also email us to be removed from all communications.
                </Li>
                <Li>
                  <strong>Portability</strong> — you can request your data in a
                  machine-readable format.
                </Li>
                <Li>
                  <strong>Objection</strong> — you can object to certain types of
                  processing, including direct marketing.
                </Li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, email us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
                . We'll respond within 30 days.
              </p>
            </Section>

            <Section title="How long we keep your data">
              <ul className="space-y-3">
                <Li>
                  <strong>Active members</strong> — we keep your account data for as long
                  as you have an account with us.
                </Li>
                <Li>
                  <strong>After cancellation</strong> — we retain basic records for up to
                  3 years for legal and billing purposes, then delete them.
                </Li>
                <Li>
                  <strong>Unsubscribed contacts</strong> — we keep a record of your
                  unsubscribe preference so we don't accidentally email you again.
                </Li>
              </ul>
            </Section>

            <Section title="Data security">
              <p>
                We take reasonable technical measures to protect your data — including
                encrypted connections (HTTPS), hashed passwords, and access controls. No
                system is 100% secure, but we take this seriously and act promptly if
                anything goes wrong.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                We may update this policy from time to time. The "last updated" date at
                the top will always reflect the most recent version. For significant
                changes, we'll notify members by email.
              </p>
            </Section>

            <Section title="Contact us">
              <p>
                For any privacy-related questions, data requests, or concerns:
              </p>
              <p className="mt-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary hover:underline font-medium"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </Section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border p-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ProvenAI. All rights reserved.</p>
      </footer>
    </div>
  );
};

// ─── Small helpers for consistent section styling ─────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
        {title}
      </h2>
      <div className="text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 list-none">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export default Privacy;
