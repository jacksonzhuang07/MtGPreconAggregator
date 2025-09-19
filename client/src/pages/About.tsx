import { Link } from 'wouter';
import { ArrowLeft, TrendingUp, Database, Shield, Zap } from 'lucide-react';

export default function About() {
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
            <h1 className="text-4xl font-bold mb-6">About MTG Precon Deck Price Analyzer</h1>
            <p className="text-xl text-white/80 leading-relaxed">
              The ultimate tool for analyzing the value of Magic: The Gathering preconstructed decks with real-time pricing data.
            </p>
          </div>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">What We Do</h2>
            <p className="text-white/90 leading-relaxed text-lg">
              Our web application helps Magic: The Gathering players, collectors, and retailers make informed decisions about preconstructed deck purchases by providing comprehensive value analysis. Simply upload your deck data, and we'll fetch real-time pricing from Scryfall to calculate total deck values, rank them by worth, and break down individual card contributions.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-white/20 rounded-lg p-6 space-y-3">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                  <h3 className="text-lg font-medium">Real-Time Pricing</h3>
                </div>
                <p className="text-white/80">
                  Integration with Scryfall API provides up-to-the-minute card prices for accurate deck valuations.
                </p>
              </div>
              
              <div className="border border-white/20 rounded-lg p-6 space-y-3">
                <div className="flex items-center space-x-3">
                  <Database className="h-6 w-6 text-green-400" />
                  <h3 className="text-lg font-medium">CSV Import</h3>
                </div>
                <p className="text-white/80">
                  Easy bulk analysis by uploading CSV files exported from popular deck building platforms like Moxfield.
                </p>
              </div>
              
              <div className="border border-white/20 rounded-lg p-6 space-y-3">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-purple-400" />
                  <h3 className="text-lg font-medium">Rate Limited</h3>
                </div>
                <p className="text-white/80">
                  Respectful API usage with automatic rate limiting to ensure service reliability and compliance.
                </p>
              </div>
              
              <div className="border border-white/20 rounded-lg p-6 space-y-3">
                <div className="flex items-center space-x-3">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  <h3 className="text-lg font-medium">Fast Analysis</h3>
                </div>
                <p className="text-white/80">
                  Efficient processing engine that can analyze multiple decks quickly while providing detailed breakdowns.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">How It Works</h2>
            <div className="space-y-4 text-white/90">
              <div className="flex items-start space-x-4">
                <div className="bg-white/10 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h3 className="font-medium text-white">Upload Your Data</h3>
                  <p className="text-white/80">Import CSV files containing your preconstructed deck lists from any source.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-white/10 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h3 className="font-medium text-white">Select Decks</h3>
                  <p className="text-white/80">Choose which decks you want to analyze from your uploaded collection.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-white/10 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h3 className="font-medium text-white">Real-Time Analysis</h3>
                  <p className="text-white/80">Our system fetches current market prices and calculates total deck values.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-white/10 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h3 className="font-medium text-white">View Results</h3>
                  <p className="text-white/80">Get detailed rankings, statistics, and card-by-card breakdowns of deck values.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Technology Stack</h2>
            <div className="text-white/90 space-y-4">
              <p>
                Built with modern web technologies for optimal performance and user experience:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white/80">
                <li>• React 18 with TypeScript</li>
                <li>• Express.js backend</li>
                <li>• PostgreSQL database</li>
                <li>• Scryfall API integration</li>
                <li>• Tailwind CSS design system</li>
                <li>• Responsive mobile-first design</li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Data Sources</h2>
            <p className="text-white/90 leading-relaxed">
              All card pricing data is sourced from <a href="https://scryfall.com" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">Scryfall</a>, 
              the most comprehensive Magic: The Gathering card database. Scryfall provides accurate, up-to-date pricing information from multiple marketplace sources, 
              ensuring our valuations reflect real market conditions.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Open Source</h2>
            <p className="text-white/90 leading-relaxed">
              This project is built with transparency in mind. The application is designed to be educational and helpful to the Magic: The Gathering 
              community. We believe in providing valuable tools that help players make informed decisions about their collections and purchases.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Support the Project</h2>
            <p className="text-white/90 leading-relaxed">
              This tool is provided free of charge to the MTG community. If you find it valuable, you can support the project by 
              using it responsibly and sharing it with fellow players. The minimal advertising helps cover hosting and development costs.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b border-white/20 pb-2">Contact & Feedback</h2>
            <p className="text-white/90 leading-relaxed">
              Have questions, suggestions, or found a bug? We'd love to hear from you! Visit our <Link href="/contact" className="text-blue-400 hover:text-blue-300 underline">Contact page</Link> 
              to get in touch. Your feedback helps us improve the tool for everyone in the community.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}