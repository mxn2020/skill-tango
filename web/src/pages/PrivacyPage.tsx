export default function PrivacyPage() {
    return (
        <div className="legal-page">
            <h1>Privacy Policy</h1>
            <p className="legal-page__updated">Last updated: February 2026</p>

            <section className="legal-section">
                <h2>1. Information We Collect</h2>
                <h3>Account Information</h3>
                <p>
                    When you create an account, we collect your email address, name, and password (stored securely hashed).
                </p>
                <h3>Usage Data</h3>
                <p>
                    We collect information about how you use the Service, including courses created, lessons completed,
                    assessment scores, and learning progress.
                </p>
                <h3>AI Interaction Data</h3>
                <p>
                    We log AI model interactions (prompts and responses) to monitor quality, debug issues, and
                    improve the learning experience. These logs do not contain personal information beyond your user ID.
                </p>
            </section>

            <section className="legal-section">
                <h2>2. How We Use Your Information</h2>
                <ul>
                    <li>To provide and personalize the learning experience</li>
                    <li>To track your progress and maintain streaks</li>
                    <li>To process payments via Stripe</li>
                    <li>To improve our AI models and content quality</li>
                    <li>To communicate service updates and changes</li>
                </ul>
            </section>

            <section className="legal-section">
                <h2>3. Third-Party Services</h2>
                <p>We use the following third-party services that may process your data:</p>
                <ul>
                    <li><strong>Convex</strong> — Database and backend infrastructure</li>
                    <li><strong>Stripe</strong> — Payment processing</li>
                    <li><strong>OpenAI / NVIDIA</strong> — AI content generation</li>
                    <li><strong>ElevenLabs</strong> — Text-to-speech audio generation</li>
                    <li><strong>Vercel</strong> — Hosting and analytics</li>
                </ul>
                <p>Each service has its own privacy policy governing data handling.</p>
            </section>

            <section className="legal-section">
                <h2>4. Data Retention</h2>
                <p>
                    Your account data and generated courses are retained as long as your account is active.
                    You may delete your courses at any time. Upon account deletion, we will remove your
                    personal data within 30 days, except where retention is required by law.
                </p>
            </section>

            <section className="legal-section">
                <h2>5. Data Security</h2>
                <p>
                    We implement industry-standard security measures including encrypted connections (HTTPS),
                    hashed passwords, and secure API key management. However, no method of transmission over
                    the Internet is 100% secure.
                </p>
            </section>

            <section className="legal-section">
                <h2>6. Your Rights</h2>
                <p>You have the right to:</p>
                <ul>
                    <li>Access the personal data we hold about you</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Export your data in a portable format</li>
                    <li>Withdraw consent for data processing</li>
                </ul>
            </section>

            <section className="legal-section">
                <h2>7. Cookies</h2>
                <p>
                    We use essential cookies for authentication and session management. We use Vercel Analytics
                    for anonymous usage statistics. We do not use advertising cookies or trackers.
                </p>
            </section>

            <section className="legal-section">
                <h2>8. Children's Privacy</h2>
                <p>
                    The Service is not intended for children under 13. We do not knowingly collect personal
                    information from children under 13. If you believe a child has provided us with data,
                    please contact us.
                </p>
            </section>

            <section className="legal-section">
                <h2>9. Changes to This Policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. We will notify you of material changes
                    via email or through the Service.
                </p>
            </section>

            <section className="legal-section">
                <h2>10. Contact</h2>
                <p>
                    For privacy-related questions, contact us at <strong>privacy@skill-tango.com</strong>.
                </p>
            </section>
        </div>
    )
}
