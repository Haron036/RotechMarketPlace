import React from "react";
import { Globe, Truck, Shield, HeadphonesIcon, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const features = [
    { icon: Globe,          label: "Global Shipping", desc: "Deliver to 190+ countries" },
    { icon: Shield,         label: "Secure Payments", desc: "SSL encrypted checkout" },
    { icon: Truck,          label: "Track Orders",    desc: "Real-time order tracking" },
    { icon: HeadphonesIcon, label: "24/7 Support",    desc: "Always here to help" },
  ];

  const sections = [
    {
      title: "Shop",
      links: [
        { label: "All Products", to: "/products" },
        { label: "New Arrivals", to: "/products?sort=newest" },
        { label: "My Cart",      to: "/cart" },
        { label: "My Orders",    to: "/my-orders" },
      ],
    },
    {
      title: "Sell",
      links: [
        { label: "Start Selling",    to: "/auth" },
        { label: "Seller Dashboard", to: "/sell" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Sign In",   to: "/auth" },
        { label: "Register",  to: "/auth" },
        { label: "My Orders", to: "/my-orders" },
        { label: "My Cart",   to: "/cart" },
      ],
    },
  ];

  const paymentBadges = [
    { label: "M-Pesa",     color: "#4CAF50", text: "M-PESA"   },
    { label: "Visa",       color: "#1A1F71", text: "VISA"     },
    { label: "Mastercard", color: "#EB001B", text: "MC"       },
    { label: "IntaSend",   color: "#6366f1", text: "INTASEND" },
  ];

  return (
    <footer className="bg-foreground text-primary-foreground">
      {/* Trust bar */}
      <div className="border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs opacity-55 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-serif text-lg mb-3">GlobalMarketplace</h4>
            <p className="text-xs opacity-55 leading-relaxed mb-4">
              Connecting artisans and creators with buyers in 190+ countries.
              Safe, fast, and reliable.
            </p>
            <div className="space-y-2">
              <a
                href="mailto:support@globalmarketplace.com"
                className="flex items-center gap-2 text-xs opacity-55 hover:opacity-100 transition-opacity"
              >
                <Mail className="w-3.5 h-3.5" />
                globalmarketplace36@gmail.com
              </a>
            </div>
          </div>

          {/* Nav columns */}
          {sections.map((section) => (
            <div key={section.title}>
              <h5 className="text-sm font-semibold mb-4">{section.title}</h5>
              <ul className="space-y-2.5">
                {section.links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-xs opacity-55 hover:opacity-100 transition-opacity"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary-foreground/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs opacity-40">
            © 2026 GlobalMarketplace. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-40 mr-1">We accept:</span>
            {paymentBadges.map(({ label, color, text }) => (
              <span
                key={label}
                title={label}
                style={{ backgroundColor: color }}
                className="inline-flex items-center justify-center px-2 py-0.5 rounded text-white text-[10px] font-bold tracking-wide"
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;