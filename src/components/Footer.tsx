import CompassIcon from "./CompassIcon";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="text-jade-700">
                <CompassIcon size={24} />
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">
                Jade <span className="text-gold-500">Compass</span>
              </span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs">
              Strategic intelligence for business decision-makers. Know your market, outmaneuver your competitors, and make decisions with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="#how-it-works" className="text-text-muted hover:text-white text-sm transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#services" className="text-text-muted hover:text-white text-sm transition-colors">
                  Services & Pricing
                </a>
              </li>
              <li>
                <a href="#faq" className="text-text-muted hover:text-white text-sm transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="/contact" className="text-text-muted hover:text-white text-sm transition-colors">
                  Get in Touch
                </a>
              </li>
              <li className="text-text-muted text-sm">
                hello@compassjade.app
              </li>
              <li className="text-text-muted text-sm">
                Response: Within 24 hours
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-dim text-xs">
            &copy; {new Date().getFullYear()} Jade Compass. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-text-dim hover:text-text-muted text-xs transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-text-dim hover:text-text-muted text-xs transition-colors">
              Terms of Service
            </a>
            <a href="/contact" className="text-text-dim hover:text-text-muted text-xs transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
