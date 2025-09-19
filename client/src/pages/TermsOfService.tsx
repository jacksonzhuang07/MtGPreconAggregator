import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-white/70">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Agreement to Terms</h2>
            <p className="text-white/90 leading-relaxed">
              By accessing and using the MTG Precon Deck Price Analyzer ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, you should not use this Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Description of Service</h2>
            <div className="text-white/90 space-y-3">
              <p>
                MTG Precon Deck Price Analyzer is a web application that provides analysis and valuation of Magic: The Gathering preconstructed decks using publicly available pricing data.
              </p>
              <p>
                The Service allows users to:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4 text-white/80">
                <li>Upload CSV files containing deck information</li>
                <li>Analyze deck values using real-time pricing data</li>
                <li>View detailed breakdowns of individual card values</li>
                <li>Compare multiple decks by value rankings</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Acceptable Use</h2>
            <div className="text-white/90 space-y-4">
              <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 pl-4 text-white/80">
                <li>Upload malicious files or content that could harm the Service</li>
                <li>Attempt to reverse engineer or hack the application</li>
                <li>Use automated systems to abuse the API or overload the servers</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Use the Service for commercial resale without permission</li>
                <li>Share or distribute user data obtained through the Service</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">User Content and Data</h2>
            <div className="text-white/90 space-y-3">
              <p>
                You retain ownership of any data you upload to the Service. By uploading content, you grant us a limited license to process and analyze your data to provide the Service functionality.
              </p>
              <p>
                You are responsible for ensuring that any content you upload:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4 text-white/80">
                <li>Does not contain viruses or malicious code</li>
                <li>Does not violate any third-party rights</li>
                <li>Complies with applicable laws</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Pricing Data Disclaimer</h2>
            <div className="text-white/90 space-y-3">
              <p>
                The pricing information provided by this Service is sourced from third-party APIs (primarily Scryfall) and is for informational purposes only. We make no guarantees about the accuracy, completeness, or timeliness of pricing data.
              </p>
              <p>
                Market prices for Magic: The Gathering cards are volatile and can change rapidly. The Service should not be used as the sole basis for financial decisions regarding card purchases or sales.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Service Availability</h2>
            <div className="text-white/90 space-y-3">
              <p>
                While we strive to maintain high availability, we do not guarantee that the Service will be available 100% of the time. The Service may be temporarily unavailable due to:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4 text-white/80">
                <li>Scheduled maintenance</li>
                <li>Third-party API limitations</li>
                <li>Server issues or technical problems</li>
                <li>Force majeure events</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Intellectual Property</h2>
            <div className="text-white/90 space-y-3">
              <p>
                Magic: The Gathering is a trademark of Wizards of the Coast LLC. This Service is not affiliated with or endorsed by Wizards of the Coast.
              </p>
              <p>
                The Service's source code, design, and functionality are protected by intellectual property laws. Users may not copy, modify, or redistribute the Service without explicit permission.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Privacy</h2>
            <p className="text-white/90 leading-relaxed">
              Your privacy is important to us. Please review our <Link href="/privacy-policy" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</Link>, which also governs your use of the Service, to understand our practices.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Disclaimers and Limitation of Liability</h2>
            <div className="text-white/90 space-y-3">
              <p>
                THE SERVICE IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR IN CONNECTION WITH THE SERVICE.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Third-Party Services</h2>
            <div className="text-white/90 space-y-3">
              <p>
                The Service integrates with third-party services including:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4 text-white/80">
                <li><strong>Scryfall API</strong> - for card data and pricing information</li>
                <li><strong>Google AdSense</strong> - for displaying advertisements</li>
              </ul>
              <p>
                These third-party services have their own terms of service and privacy policies. We are not responsible for their practices or policies.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Termination</h2>
            <p className="text-white/90 leading-relaxed">
              We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Changes to Terms</h2>
            <p className="text-white/90 leading-relaxed">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Governing Law</h2>
            <p className="text-white/90 leading-relaxed">
              These Terms shall be interpreted and governed by the laws of the jurisdiction in which the Service operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Contact Information</h2>
            <p className="text-white/90 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through our <Link href="/contact" className="text-blue-400 hover:text-blue-300 underline">Contact page</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}