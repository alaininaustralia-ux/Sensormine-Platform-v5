/**
 * Privacy Policy Page
 * 
 * Comprehensive privacy policy for the Sensormine Platform
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Sensormine Platform',
  description: 'Privacy policy and data protection information for Sensormine Platform',
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last Updated: December 12, 2025
      </p>

      <div className="space-y-8 prose prose-slate max-w-none">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to Sensormine Platform ("we", "us", or "our"). We are committed to protecting your personal 
            information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, 
            and safeguard your information when you use our Industrial IoT platform and services.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            By using the Sensormine Platform, you agree to the collection and use of information in accordance 
            with this policy. If you do not agree with our policies and practices, please do not use our services.
          </p>
        </section>

        {/* Information We Collect */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-medium mt-6 mb-3">2.1 Account Information</h3>
          <p className="text-muted-foreground leading-relaxed">
            When you create an account, we collect:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li>Name and email address</li>
            <li>Organization/company name</li>
            <li>Password (encrypted)</li>
            <li>Profile preferences and settings</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-3">2.2 Device and Telemetry Data</h3>
          <p className="text-muted-foreground leading-relaxed">
            Our platform collects and processes:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li>IoT device telemetry data (sensor readings, timestamps, device metadata)</li>
            <li>Device configuration and status information</li>
            <li>Asset hierarchy and digital twin data</li>
            <li>Alert rules and notification preferences</li>
            <li>Dashboard configurations and widget settings</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-3">2.3 Usage Data</h3>
          <p className="text-muted-foreground leading-relaxed">
            We automatically collect information about how you use the platform:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li>Log data (IP address, browser type, pages visited)</li>
            <li>Session information and authentication tokens</li>
            <li>Feature usage analytics and performance metrics</li>
            <li>Error reports and diagnostic information</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-3">2.4 Billing Information</h3>
          <p className="text-muted-foreground leading-relaxed">
            If you subscribe to paid services:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li>Payment information (processed securely through Stripe)</li>
            <li>Billing address and tax information</li>
            <li>Subscription and usage-based billing records</li>
          </ul>
        </section>

        {/* How We Use Your Information */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li>Provide, operate, and maintain the Sensormine Platform</li>
            <li>Process your transactions and manage your account</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Monitor and analyze usage trends to improve our services</li>
            <li>Detect, prevent, and address technical issues and security threats</li>
            <li>Comply with legal obligations and enforce our terms of service</li>
          </ul>
        </section>

        {/* Data Storage and Security */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
          
          <h3 className="text-xl font-medium mt-6 mb-3">4.1 Data Storage</h3>
          <p className="text-muted-foreground leading-relaxed">
            Your data is stored in secure, cloud-agnostic infrastructure:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li>Metadata in TimescaleDB with encryption at rest</li>
            <li>Time-series telemetry data with automatic compression and retention policies</li>
            <li>Object storage (videos, files) in encrypted buckets</li>
            <li>Geographically distributed backups with 90-day retention for telemetry</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-3">4.2 Security Measures</h3>
          <p className="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li>End-to-end encryption for data in transit (TLS/SSL)</li>
            <li>Encryption at rest for all stored data</li>
            <li>Multi-tenant data isolation with row-level security</li>
            <li>Regular security audits and penetration testing</li>
            <li>Role-based access control (RBAC) and permission management</li>
            <li>Secure API authentication using JWT tokens</li>
          </ul>
        </section>

        {/* Data Sharing and Disclosure */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do not sell your personal information. We may share your information in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (e.g., Stripe for payment processing, cloud hosting providers)</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
          </ul>
        </section>

        {/* Multi-Tenancy and Data Isolation */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Multi-Tenancy and Data Isolation</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Sensormine Platform is a multi-tenant system. Your data is logically isolated from other 
            organizations using:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li>Tenant-based access control on all database queries</li>
            <li>Row-level security policies in PostgreSQL</li>
            <li>Tenant context validation in all API requests</li>
            <li>Separate encryption keys per tenant</li>
          </ul>
        </section>

        {/* Data Retention */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your information for as long as necessary to provide services:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li><strong>Account Data:</strong> Retained until account deletion or as required by law</li>
            <li><strong>Telemetry Data:</strong> 90 days in hot storage, 2 years in cold storage (configurable)</li>
            <li><strong>Billing Records:</strong> Retained for 7 years for tax and accounting purposes</li>
            <li><strong>Logs and Analytics:</strong> 30-90 days depending on type</li>
          </ul>
        </section>

        {/* Your Rights */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Data Portability:</strong> Export your data in a machine-readable format</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
            <li><strong>Object:</strong> Object to certain processing of your data</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            To exercise these rights, contact us at <a href="mailto:privacy@sensormine.com" className="text-primary underline">privacy@sensormine.com</a>
          </p>
        </section>

        {/* GDPR Compliance */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">9. GDPR Compliance (European Users)</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you are located in the European Economic Area (EEA), we process your data based on:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li><strong>Contract Performance:</strong> Processing necessary to provide services</li>
            <li><strong>Consent:</strong> Where you have given explicit consent</li>
            <li><strong>Legitimate Interests:</strong> For analytics and service improvement</li>
            <li><strong>Legal Obligations:</strong> To comply with applicable laws</li>
          </ul>
        </section>

        {/* Cookies and Tracking */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Cookies and Tracking Technologies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use cookies and similar technologies to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li>Maintain your session and authentication state</li>
            <li>Remember your preferences and settings</li>
            <li>Analyze platform usage and performance</li>
            <li>Provide personalized dashboard experiences</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            You can control cookies through your browser settings, though some features may not function properly if cookies are disabled.
          </p>
        </section>

        {/* Children's Privacy */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Sensormine Platform is not intended for use by individuals under the age of 18. We do not 
            knowingly collect personal information from children. If you become aware that a child has provided 
            us with personal information, please contact us immediately.
          </p>
        </section>

        {/* International Data Transfers */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">12. International Data Transfers</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your data may be transferred to and processed in countries other than your country of residence. 
            We ensure adequate safeguards are in place for such transfers, including:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
            <li>Data Processing Agreements with third-party vendors</li>
            <li>Compliance with applicable data protection frameworks</li>
          </ul>
        </section>

        {/* Changes to This Policy */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Changes to This Privacy Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any significant changes by:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
            <li>Posting the updated policy on this page</li>
            <li>Updating the "Last Updated" date</li>
            <li>Sending an email notification to your registered email address</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Your continued use of the platform after changes become effective constitutes acceptance of the updated policy.
          </p>
        </section>

        {/* Contact Us */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">Sensormine Platform</p>
            <p className="text-muted-foreground mt-2">
              Email: <a href="mailto:privacy@sensormine.com" className="text-primary underline">privacy@sensormine.com</a>
            </p>
            <p className="text-muted-foreground">
              Support: <a href="mailto:support@sensormine.com" className="text-primary underline">support@sensormine.com</a>
            </p>
            <p className="text-muted-foreground mt-2">
              Data Protection Officer: <a href="mailto:dpo@sensormine.com" className="text-primary underline">dpo@sensormine.com</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
