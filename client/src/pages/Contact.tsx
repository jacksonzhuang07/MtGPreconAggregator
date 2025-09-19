import { Link } from 'wouter';
import { ArrowLeft, Mail, MessageSquare, Bug, Lightbulb } from 'lucide-react';

export default function Contact() {
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

        <div className="space-y-12">
          <div>
            <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Get in touch with questions, feedback, or support requests about the MTG Precon Deck Price Analyzer.
            </p>
          </div>

          <section className="space-y-8">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">How to Reach Us</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border border-white/20 rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-6 w-6 text-blue-400" />
                  <h3 className="text-lg font-medium">General Inquiries</h3>
                </div>
                <p className="text-white/80">
                  For general questions about the application, features, or usage.
                </p>
                <div className="bg-white/5 rounded-lg p-3">
                  <a href="mailto:anbiljz@gmail.com" className="text-blue-400 hover:text-blue-300">
                    <code>anbiljz@gmail.com</code>
                  </a>
                </div>
              </div>

              <div className="border border-white/20 rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <Bug className="h-6 w-6 text-red-400" />
                  <h3 className="text-lg font-medium">Bug Reports</h3>
                </div>
                <p className="text-white/80">
                  Found a bug or experiencing technical issues? Let us know!
                </p>
                <div className="bg-white/5 rounded-lg p-3">
                  <a href="mailto:anbiljz@gmail.com" className="text-red-400 hover:text-red-300">
                    <code>anbiljz@gmail.com</code>
                  </a>
                </div>
              </div>

              <div className="border border-white/20 rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="h-6 w-6 text-yellow-400" />
                  <h3 className="text-lg font-medium">Feature Requests</h3>
                </div>
                <p className="text-white/80">
                  Have ideas for new features or improvements?
                </p>
                <div className="bg-white/5 rounded-lg p-3">
                  <a href="mailto:anbiljz@gmail.com" className="text-yellow-400 hover:text-yellow-300">
                    <code>anbiljz@gmail.com</code>
                  </a>
                </div>
              </div>

              <div className="border border-white/20 rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-6 w-6 text-green-400" />
                  <h3 className="text-lg font-medium">Feedback</h3>
                </div>
                <p className="text-white/80">
                  Share your experience and help us improve the tool.
                </p>
                <div className="bg-white/5 rounded-lg p-3">
                  <a href="mailto:anbiljz@gmail.com" className="text-green-400 hover:text-green-300">
                    <code>anbiljz@gmail.com</code>
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Common Questions</h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-blue-400 pl-6">
                <h3 className="text-lg font-medium text-white mb-2">How do I format my CSV file?</h3>
                <p className="text-white/80 leading-relaxed">
                  Our tool works best with CSV exports from Moxfield, but supports any CSV with columns for card name, quantity, and set information. 
                  The system automatically detects common column formats.
                </p>
              </div>

              <div className="border-l-4 border-green-400 pl-6">
                <h3 className="text-lg font-medium text-white mb-2">Why are some cards not found?</h3>
                <p className="text-white/80 leading-relaxed">
                  Occasionally, card names might not match Scryfall's database exactly due to special characters, alternate names, or very new releases. 
                  We're constantly improving our matching algorithm.
                </p>
              </div>

              <div className="border-l-4 border-yellow-400 pl-6">
                <h3 className="text-lg font-medium text-white mb-2">How often are prices updated?</h3>
                <p className="text-white/80 leading-relaxed">
                  Prices are fetched in real-time from Scryfall's API during each analysis. This ensures you always get the most current market values 
                  available.
                </p>
              </div>

              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-lg font-medium text-white mb-2">Is my data stored permanently?</h3>
                <p className="text-white/80 leading-relaxed">
                  No, your uploaded CSV data is processed temporarily and not permanently stored on our servers. Analysis results are cached briefly 
                  for performance but not linked to personal information.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Response Time</h2>
            <div className="bg-white/5 rounded-lg p-6">
              <p className="text-white/90 leading-relaxed">
                We aim to respond to all inquiries within <strong className="text-white">24-48 hours</strong>. 
                Bug reports and technical issues are prioritized and typically receive faster responses. 
                Please include as much detail as possible to help us assist you effectively.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">When Contacting Us</h2>
            <div className="text-white/90 space-y-4">
              <p>To help us provide the best support, please include:</p>
              <ul className="list-disc list-inside space-y-2 text-white/80 pl-4">
                <li>A clear description of your question or issue</li>
                <li>Steps to reproduce any bugs you encountered</li>
                <li>Your browser type and version (if reporting technical issues)</li>
                <li>Any error messages you received</li>
                <li>Screenshots if they would be helpful</li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Community</h2>
            <p className="text-white/90 leading-relaxed">
              This tool is built for the Magic: The Gathering community. We welcome suggestions, feedback, and contributions that help make 
              deck analysis more accessible and accurate for players worldwide. Your input helps shape the future of this tool.
            </p>
          </section>

          <div className="border border-white/20 rounded-lg p-6 bg-white/5">
            <h3 className="text-lg font-medium text-white mb-3">Quick Links</h3>
            <div className="flex flex-wrap gap-4">
              <Link href="/about" className="text-blue-400 hover:text-blue-300 underline">
                About the Project
              </Link>
              <Link href="/privacy-policy" className="text-blue-400 hover:text-blue-300 underline">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-blue-400 hover:text-blue-300 underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}