import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply when you use Ascned.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <section>
        <h2>Agreement</h2>
        <p>
          By creating an account or using Ascned, you agree to these terms. If you do not agree, please do not use
          the service.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <p>
          You are responsible for the activity on your account and for keeping your password secure. Provide
          accurate information and let us know if you believe your account has been compromised.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>Do not use Ascned to break the law or infringe the rights of others.</li>
          <li>Do not attempt to access accounts or data that do not belong to you.</li>
          <li>Do not disrupt, overload, probe or bypass the security of the service.</li>
          <li>Do not upload malware or use the service to send spam.</li>
        </ul>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You keep ownership of the tasks, habits, goals and other content you create. You grant us the limited
          permission needed to store, sync and display that content so the service can work for you.
        </p>
      </section>

      <section>
        <h2>Availability and changes</h2>
        <p>
          Ascned is provided as-is and may change, be interrupted or be discontinued. We aim to keep the service
          available but cannot guarantee uninterrupted access or permanent storage.
        </p>
      </section>

      <section>
        <h2>Disclaimers</h2>
        <p>
          To the maximum extent permitted by law, Ascned is provided without warranties of any kind, including
          fitness for a particular purpose and non-infringement. Ascned is a productivity tool, not professional,
          medical or financial advice.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for indirect, incidental or consequential
          damages, or for lost data, profits or opportunities arising from your use of the service.
        </p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>
          You may stop using Ascned at any time. We may suspend or terminate access if these terms are violated or
          if necessary to protect the service or other users.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          We may update these terms as the service evolves. Continued use after an update means you accept the
          revised terms.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent through the{' '}
          <a href="https://github.com/spoongyx/veyro/issues" target="_blank" rel="noopener noreferrer">
            Ascned support page
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
