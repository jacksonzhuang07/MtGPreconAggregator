# MTG Precon Deck Price Analyzer

A comprehensive full-stack web application for analyzing the value of Magic: The Gathering preconstructed decks with real-time pricing data and Google AdSense monetization.

![MTG Precon Analyzer](https://img.shields.io/badge/MTG-Precon%20Analyzer-blue)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![AdSense](https://img.shields.io/badge/Google-AdSense-green)

## Features

- **Real-time pricing** via Scryfall API integration
- **CSV import** for bulk deck analysis (Moxfield compatible)
- **Interactive rankings** with filtering and sorting
- **Card breakdowns** with detailed value analysis
- **Monetization** through Google AdSense integration
- **Responsive design** with black/white minimalist aesthetic
- **Rate limiting** to respect API constraints

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (optional - uses in-memory storage by default)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mtg-precon-analyzer.git
cd mtg-precon-analyzer

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

## Google AdSense Setup Guide

### Phase 1: Prepare Your Site for AdSense

#### 1. Deploy to GitHub Pages

**Important**: For AdSense approval, you need the root domain format.

1. Create a repository named exactly: `yourusername.github.io`
2. Push your code to this repository
3. Enable GitHub Pages in repository settings
4. Your site will be available at: `https://yourusername.github.io`

#### 2. Essential Pages (Already Included)

This application includes all required pages for AdSense approval:

- ✅ **Privacy Policy** (`/privacy-policy`)
- ✅ **About Page** (`/about`) 
- ✅ **Contact Page** (`/contact`)
- ✅ **Terms of Service** (`/terms-of-service`)

These pages are accessible via the footer navigation and contain comprehensive, original content.

#### 3. Environment Variables

Set up your AdSense Publisher ID:

**For all environments:**
```bash
# Add to your environment secrets/variables
VITE_GOOGLE_ADSENSE_PUBLISHER_ID=ca-pub-YOUR_PUBLISHER_ID
```

**Note**: The `VITE_` prefix is required for the frontend to access the variable in all environments including GitHub Pages, Netlify, Vercel, etc.

### Phase 2: Apply for Google AdSense

#### Prerequisites for Approval

1. **Age**: You must be 18+ years old
2. **Content**: Your MTG analyzer provides original, valuable functionality ✅
3. **Traffic**: Aim for 100+ daily visitors before applying
4. **Domain age**: 3-6 months old domains have better approval rates

#### Application Process

1. **Visit AdSense**: Go to [Google AdSense](https://www.google.com/adsense/)
2. **Create account**: Sign up with your Google account
3. **Add your site**: Enter `https://yourusername.github.io`
4. **Connect your site**: Add the AdSense code to your `<head>` tag
5. **Wait for review**: Typically 1-14 days for initial review

#### AdSense Integration (Already Implemented)

The application includes a `GoogleAdSense` component with ads placed strategically:

**Ad Placement 1: During Analysis**
- Location: Below progress section during deck analysis
- Format: Auto-responsive  
- Slot ID: `1234567890` (update with your actual ad slot)

**Ad Placement 2: Card Breakdown**
- Location: Within card detail expansion
- Format: Rectangle
- Slot ID: `9876543210` (update with your actual ad slot)

**Additional Setup Requirements:**

1. **Add ads.txt file**: Create a `public/ads.txt` file with:
```
google.com, pub-xxxxxxxxxxxxxxxx, DIRECT, f08c47fec0942fa0
```
Replace `pub-xxxxxxxxxxxxxxxx` with your Publisher ID.

2. **Update Ad Slots**: In the GoogleAdSense components, replace placeholder slot IDs with your actual Google AdSense ad slot IDs from your AdSense dashboard.

### Phase 3: Revenue Optimization

#### Expected Revenue

- **Minimum payout**: $100 from Google
- **Typical RPM**: $1-3 per 1,000 page views
- **Monthly target**: 20,000-40,000 page views = $100-200/month

#### Traffic Generation Tips

1. **SEO Optimization**: All pages include proper meta descriptions and titles
2. **Content Marketing**: Share on MTG forums and communities
3. **Social Media**: Promote on Twitter, Reddit (r/magicTCG), Discord servers
4. **Features**: Regular updates and new precon deck analysis

#### Ad Performance Monitoring

Access your AdSense dashboard to track:
- Page views and impressions
- Click-through rates (CTR)
- Revenue per mille (RPM)
- Geographic performance

## Technical Architecture

### Frontend Stack
- **React 18** with TypeScript and Vite
- **Wouter** for lightweight routing
- **TanStack Query** for API state management
- **Tailwind CSS** with shadcn/ui components
- **Radix UI** for accessible primitives

### Backend Stack
- **Express.js** with TypeScript
- **Drizzle ORM** with PostgreSQL
- **Scryfall API** integration
- **Rate limiting** for API compliance
- **Session management** with connect-pg-simple

### Key Components

```
client/src/
├── components/
│   ├── GoogleAdSense.tsx      # AdSense integration component
│   ├── ProgressSection.tsx    # Analysis progress with ads
│   ├── CardBreakdown.tsx      # Card details with ads
│   └── PreconRankingTable.tsx # Main results table
├── pages/
│   ├── StaticHome.tsx         # Main application page
│   ├── About.tsx              # About page for AdSense
│   ├── Contact.tsx            # Contact page for AdSense
│   ├── PrivacyPolicy.tsx      # Privacy policy for AdSense
│   └── TermsOfService.tsx     # Terms of service for AdSense
└── hooks/
    └── useStaticAnalysis.ts   # Analysis logic and state
```

## Deployment

### Recommended Deployment (Static Hosting)

**Note**: This is a full-stack application with Express.js backend. GitHub Pages only hosts static files, so use these recommended platforms:

#### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy with zero configuration
vercel

# Add environment variable in Vercel dashboard:
# VITE_GOOGLE_ADSENSE_PUBLISHER_ID=ca-pub-YOUR_PUBLISHER_ID
```

#### Option 2: Netlify
```bash
# Build for production
npm run build

# Deploy to Netlify (drag & drop dist folder or use CLI)
# Add environment variable in Netlify dashboard:
# VITE_GOOGLE_ADSENSE_PUBLISHER_ID=ca-pub-YOUR_PUBLISHER_ID
```

#### Option 3: Static-only GitHub Pages
If you want to use GitHub Pages, modify the app to be frontend-only:
1. Remove all server-side functionality
2. Use static JSON files for deck data  
3. Deploy only the `client/dist` folder

### Custom Domain (Recommended)

For better AdSense approval rates:

1. **Purchase a domain** (e.g., `mtg-analyzer.com`)
2. **Configure DNS** to point to GitHub Pages
3. **Update repository settings** with custom domain
4. **Enable HTTPS** (automatic with GitHub Pages)

## AdSense Compliance

### Content Policy Compliance
- ✅ Original content and functionality
- ✅ No copyrighted Magic card images used
- ✅ Pricing data properly attributed to Scryfall
- ✅ Clean, professional design
- ✅ Mobile-responsive layout

### Technical Compliance
- ✅ Fast loading times with Vite optimization
- ✅ Accessible design with proper ARIA labels
- ✅ Clean HTML structure
- ✅ No malicious code or redirects
- ✅ Proper error handling

## Troubleshooting

### Common AdSense Issues

**"Site can't be reached"**
- Ensure your GitHub repository is named `yourusername.github.io`
- Check that GitHub Pages is enabled in settings
- Wait up to 24 hours for DNS propagation

**"Insufficient content"**
- The app functionality counts as content
- Add more detailed descriptions in About/Contact pages if needed
- Consider adding a blog section with MTG strategy content

**"Navigation problems"**
- All required pages are accessible via footer navigation
- Test all internal links work properly
- Ensure 404 errors don't prevent crawling

### Development Issues

**AdSense ads not showing locally**
- Ads only show on approved domains
- Use placeholder content during development
- Set `VITE_GOOGLE_ADSENSE_PUBLISHER_ID` for testing

**Rate limiting errors**
- Scryfall API has rate limits (10 requests/second)
- Built-in delays handle this automatically
- Check console for rate limit warnings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application is not affiliated with Wizards of the Coast or Magic: The Gathering. All card data and pricing information is sourced from Scryfall's public API. Card names and game mechanics are trademarks of Wizards of the Coast.

## Support

- **GitHub Issues**: Report bugs and request features
- **Email**: Contact via the Contact page
- **Documentation**: Check this README for setup help

---

**Ready for monetization!** Follow the AdSense setup guide above to start earning revenue from your MTG analysis tool.