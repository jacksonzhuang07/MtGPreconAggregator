import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 text-white/70 hover:text-white mb-8 transition-colors"
          data-testid="link-home"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-white/70">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Introduction</h2>
            <p className="text-white/90 leading-relaxed">
              This Privacy Policy describes how MTG Precon Deck Price Analyzer ("we", "our", or "us") collects, uses, and protects your information when you use our website and services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Information We Collect</h2>
            <div className="space-y-4 text-white/90">
              <div>
                <h3 className="text-lg font-medium text-white">Data You Provide</h3>
                <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
                  <li>CSV files containing Magic: The Gathering deck data that you upload</li>
                  <li>Deck selections and analysis preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Automatically Collected Data</h3>
                <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>IP address (anonymized)</li>
                  <li>Page views and site interactions</li>
                  <li>Device information for responsive design optimization</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-white/90 pl-4">
              <li>Process and analyze your MTG deck data</li>
              <li>Provide real-time pricing information via Scryfall API</li>
              <li>Improve our service performance and user experience</li>
              <li>Display relevant advertisements through Google AdSense</li>
              <li>Maintain website security and prevent abuse</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Data Storage and Security</h2>
            <div className="text-white/90 space-y-3">
              <p>
                Your uploaded CSV data is processed locally in your browser and temporarily stored in our database during analysis. We do not permanently store your personal deck data.
              </p>
              <p>
                We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Third-Party Services</h2>
            <div className="text-white/90 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white">Scryfall API</h3>
                <p>We use Scryfall's API to fetch Magic: The Gathering card pricing data. Please review <a href="https://scryfall.com/privacy" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">Scryfall's Privacy Policy</a>.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Google AdSense</h3>
                <div className="space-y-3">
                  <p>We use Google AdSense to display advertisements on our website. Google and its partners use cookies and other technologies to:</p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-white/80">
                    <li>Serve personalized ads based on your interests and previous visits</li>
                    <li>Serve non-personalized ads when personalization is not available</li>
                    <li>Measure ad performance and provide reporting</li>
                  </ul>
                  <p>You can control your advertising experience:</p>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-white/80">
                    <li><a href="https://adssettings.google.com" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a> - Manage personalized advertising</li>
                    <li><a href="https://optout.aboutads.info" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance</a> - Opt out of interest-based ads</li>
                    <li><a href="https://policies.google.com/technologies/ads" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">Google's Advertising Policy</a> - Learn more about how Google uses data</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Cookies</h2>
            <p className="text-white/90 leading-relaxed">
              We use essential cookies to maintain your session and preferences. Third-party services like Google AdSense may also use cookies for advertising purposes. You can control cookie settings in your browser.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Your Rights</h2>
            <ul className="list-disc list-inside space-y-2 text-white/90 pl-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of data collection where possible</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Changes to This Policy</h2>
            <p className="text-white/90 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Contact Us</h2>
            <p className="text-white/90 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us through our <Link href="/contact" className="text-blue-400 hover:text-blue-300 underline">Contact page</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}