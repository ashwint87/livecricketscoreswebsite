import React from 'react';

export default function PrivacyPolicy() {
  const effectiveDate = 'September 1, 2025';

  return (
    <div className="page-container privacy-policy">
      <header className="pp-header">
        <h1>Privacy Policy</h1>
        <p className="pp-meta">Effective Date: {effectiveDate}</p>
      </header>

      <section className="pp-intro">
        <p>
          At <strong>CricBud</strong>, accessible from <a href="https://www.cricbud.com" target="_blank" rel="noreferrer">https://www.cricbud.com</a>, we respect your privacy. 
          This policy explains what information we (don’t) collect, how limited technical data may be used to run the site, and your choices.
          By using CricBud, you agree to this Privacy Policy.
        </p>
      </section>

      <nav className="pp-toc" aria-label="Table of contents">
        <ol>
          <li><a href="#no-personal-info">No Personal Information Collected</a></li>
          <li><a href="#logs">Technical &amp; Log Information</a></li>
          <li><a href="#cookies">Cookies &amp; Similar Technologies</a></li>
          <li><a href="#third-party">Third-Party Services &amp; Content Providers</a></li>
          <li><a href="#security">Data Security</a></li>
          <li><a href="#choices">Your Choices</a></li>
          <li><a href="#children">Children’s Privacy</a></li>
          <li><a href="#analytics">Analytics</a></li>
          <li><a href="#advertising">Advertising</a></li>
          <li><a href="#changes">Changes to This Policy</a></li>
          <li><a href="#contact">Contact Us</a></li>
        </ol>
      </nav>

      <section id="no-personal-info" className="pp-section">
        <h2>1. No Personal Information Collected</h2>
        <p>
          CricBud does <strong>not require registration or login</strong>. We <strong>do not collect</strong> your name, email address,
          phone number, precise location, or any other information that directly identifies you.
        </p>
      </section>

      <section id="logs" className="pp-section">
        <h2>2. Technical &amp; Log Information</h2>
        <p>
          To keep the website secure and performing well, servers may automatically record non-identifiable technical data such as:
        </p>
        <ul>
          <li>IP address, approximate region (derived from IP), and timestamp of access</li>
          <li>Browser type/version, device/OS information</li>
          <li>Pages visited, referring/exit pages, and general usage metrics</li>
        </ul>
        <p>
          This information is used in aggregated form for analytics, troubleshooting, and improving the site. It is <strong>not used</strong> to personally identify you.
        </p>
      </section>

      <section id="cookies" className="pp-section">
        <h2>3. Cookies &amp; Similar Technologies</h2>
        <p>
          CricBud itself does not set cookies for user tracking. However, certain embedded or integrated third-party services
          (for example, analytics or advertising partners) may use cookies, local storage, or similar technologies to measure usage
          or deliver content. You can control or block cookies via your browser settings.
        </p>
      </section>

      <section id="third-party" className="pp-section">
        <h2>4. Third-Party Services &amp; Content Providers</h2>
        <p>
          CricBud may display or retrieve content from external sources such as news platforms, video services, public data repositories,
          or cricket score providers. These third-party services operate under their own terms and privacy policies, and may collect limited
          technical information based on your interaction with their content.
        </p>
        <p>
          CricBud does not control those platforms and is not responsible for their practices or content. We encourage you to review the
          privacy policies of any third-party websites or services you interact with through CricBud.
        </p>
      </section>

      <section id="security" className="pp-section">
        <h2>5. Data Security</h2>
        <p>
          We use reasonable technical and organizational measures to safeguard our systems. While no method of transmission or storage
          is completely secure, the risk is minimal since we do not collect or store personal data.
        </p>
      </section>

      <section id="choices" className="pp-section">
        <h2>6. Your Choices</h2>
        <ul>
          <li><strong>No account required:</strong> You can use CricBud without providing personal data.</li>
          <li><strong>Cookie controls:</strong> Use your browser settings to block or delete cookies and manage site data.</li>
          <li><strong>Do-not-track:</strong> If your browser sends a DNT signal, our first‑party services do not track you across sites.</li>
        </ul>
      </section>

      <section id="children" className="pp-section">
        <h2>7. Children’s Privacy</h2>
        <p>
          CricBud is intended for a general audience. We do not knowingly collect personal information from children under 13.
          If you believe a minor has provided information to us, please contact us and we will promptly delete it.
        </p>
      </section>

      <section id="analytics" className="pp-section">
        <h2>8. Analytics</h2>
        <p>
          We may use third-party service providers such as <strong>Google Analytics</strong> to monitor and analyze usage of our website.
        </p>
        <p>
          Google Analytics is a web analytics service provided by Google that tracks and reports website traffic.
          Google may use the collected data to contextualize and personalize ads on its advertising network.
          The data is also shared across other Google services.
        </p>
        <p>
          For more information on how Google handles data, please visit the{' '}
          <a href="https://www.google.com/intl/en/policies/privacy/" target="_blank" rel="noopener noreferrer">Google Privacy & Terms</a>.
        </p>
      </section>

      <section id="advertising" className="pp-section">
        <h2>9. Advertising</h2>
        <p>
          We may use third-party advertising providers to serve ads and support our service. One of the primary providers is 
          <strong>AdMob by Google</strong>, which may collect information about your device and browsing behavior to display
          relevant ads.
        </p>
        <p>
          For more details on how Google uses data in ads, visit:{' '}
          <a href="https://www.google.com/policies/privacy/partners/" target="_blank" rel="noopener noreferrer">
            How Google uses data from partner's sites or apps
          </a>.
        </p>
      </section>

      <section id="changes" className="pp-section">
        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy to reflect changes in technology, legal requirements, or our services.
          Updates will be posted here with a revised Effective Date. Your continued use of CricBud after any changes
          constitutes acceptance of the updated policy.
        </p>
      </section>

      <section id="contact" className="pp-section">
        <h2>11. Contact Us</h2>
        <p>
          If you have any questions, concerns, or feedback regarding this Privacy Policy,
          please visit our <a href="/contact">Contact Us</a> page.
        </p>
      </section>
    </div>
  );
}
