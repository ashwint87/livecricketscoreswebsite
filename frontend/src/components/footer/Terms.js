import React from 'react';

export default function Terms() {
  const effectiveDate = 'September 1, 2025';

  return (
    <div className="page-container terms-of-service">
      <header className="tos-header">
        <h1>Terms of Service</h1>
        <p className="tos-meta">Effective Date: {effectiveDate}</p>
      </header>

      <section className="tos-section">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using <strong>CricBud</strong> (https://www.cricbud.com), you agree to comply with and be bound by these Terms of Service.
          If you do not agree to these terms, please do not use the site.
        </p>
      </section>

      <section className="tos-section">
        <h2>2. Use of the Website</h2>
        <ul>
          <li>CricBud is a publicly accessible website providing live cricket scores, match details, and cricket-related content.</li>
          <li>You may use the site for personal, non-commercial purposes only.</li>
          <li>You agree not to misuse the site, engage in scraping, reverse-engineering, or attempt to disrupt the services in any way.</li>
        </ul>
      </section>

      <section className="tos-section">
        <h2>3. Content and Data Sources</h2>
        <p>
          All content displayed on CricBud is provided for general information and entertainment purposes only.
          We use data from third-party providers such as cricket APIs, news services, and public repositories.
          CricBud does not guarantee the accuracy, timeliness, or completeness of the information.
        </p>
      </section>

      <section className="tos-section">
        <h2>4. Intellectual Property</h2>
        <p>
          The CricBud name, logo, and design are intellectual property of CricBud.
          All other trademarks, logos, and content belong to their respective owners.
        </p>
        <p>
          You may not copy, reproduce, or redistribute any part of the website or its content without prior written permission.
        </p>
      </section>

      <section className="tos-section">
        <h2>5. Third-Party Services and Links</h2>
        <p>
          CricBud uses third-party APIs and content sources to display live scores, player data, and cricket-related information. While we strive to ensure that the data shown is accurate and up to date, all such data is retrieved from external providers (such as official cricket APIs) and may occasionally contain discrepancies or delays beyond our control.
        </p>
        <p>
          CricBud is responsible for how this data is presented and displayed on the platform, but we do not guarantee absolute accuracy, completeness, or uninterrupted availability of third-party-sourced data.
        </p>
        <p>
          The site may also contain links or embeds to external websites (such as news articles or videos). We do not own or operate those third-party sites and are not responsible for their content, terms, or privacy practices. Your interaction with such platforms is governed by their respective policies.
        </p>
      </section>

      <section className="tos-section">
        <h2>6. Limitation of Liability</h2>
        <p>
          CricBud is provided on an “as is” and “as available” basis.
          We do not make any warranties or guarantees about the functionality, uptime, or accuracy of the data shown.
        </p>
        <p>
          Under no circumstances shall CricBud or its team be liable for any direct, indirect, incidental, or consequential damages arising from your use of the site.
        </p>
      </section>

      <section className="tos-section">
        <h2>7. Modifications to the Service</h2>
        <p>
          We reserve the right to update, suspend, or discontinue any part of the website or its services at any time, without prior notice.
        </p>
      </section>

      <section className="tos-section">
        <h2>8. Governing Law</h2>
        <p>
          These Terms are governed by the laws of India.
          Any disputes arising out of or related to these Terms shall be subject to the jurisdiction of the courts located in Mangalore, Karnataka.
        </p>
      </section>

      <section className="tos-section">
        <h2>9. Contact Us</h2>
        <p>
          For questions about these Terms of Service, please visit our{' '}
          <a href="/contact">Contact Us</a> page.
        </p>
      </section>
    </div>
  );
}
