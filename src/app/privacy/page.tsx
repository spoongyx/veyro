import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Ascned collects, uses and protects your data.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <section>
        <h2>What Ascned is</h2>
        <p>
          Ascned is a personal productivity workspace for tasks, habits, goals and focus sessions. This policy
          explains what data the service handles and the choices you have.
        </p>
      </section>

      <section>
        <h2>Data we collect</h2>
        <ul>
          <li>
            <strong>Account data:</strong> your email address and authentication identifiers. If you sign in with
            Google, we receive the basic account information Google shares for authentication.
          </li>
          <li>
            <strong>Content you create:</strong> tasks, habits, habit completions, goals and focus sessions, including
            any notes or dates you add.
          </li>
          <li>
            <strong>Technical data:</strong> our hosting and database providers may process IP addresses, device
            information and request logs to operate and secure the service.
          </li>
          <li>
            <strong>Device storage:</strong> your theme preference, notification settings, authentication cookies and
            an offline queue are stored in your browser.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use data</h2>
        <p>
          We use your data to provide the workspace, keep you signed in, sync your content across devices, deliver
          the features you request and protect the service from abuse. We do not sell your personal data or use it
          for advertising.
        </p>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p>
          Ascned uses cookies for authentication and your theme choice, and browser storage for preferences and the
          offline queue. There are no advertising or third-party analytics cookies. Clearing site data signs you out
          and removes local preferences.
        </p>
      </section>

      <section>
        <h2>Service providers</h2>
        <ul>
          <li>
            <strong>Supabase</strong> provides authentication and database hosting.
          </li>
          <li>
            <strong>Vercel</strong> hosts the application.
          </li>
          <li>
            <strong>Google</strong> is used only if you choose Google sign-in, and to serve the Inter web font.
          </li>
        </ul>
        <p>These providers process data on our behalf under their own terms and security commitments.</p>
      </section>

      <section>
        <h2>Retention and deletion</h2>
        <p>
          Your content is retained while your account exists. Deleting your account removes your workspace data
          through cascading database deletion. To request account or data deletion, use the Contact link below.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Data is transmitted over HTTPS and stored with row-level security so that each account can only access its
          own records. No system is completely secure, so please use a strong, unique password.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Ascned is not directed at children under 13, and we do not knowingly collect personal data from them.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          We may update this policy as the service evolves. Material changes will be reflected by the date at the top
          of this page.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions or requests about your data can be sent through the{' '}
          <a href="https://github.com/spoongyx/veyro/issues" target="_blank" rel="noopener noreferrer">
            Ascned support page
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
