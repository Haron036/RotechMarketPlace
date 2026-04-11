import React from "react";
import { Globe, Truck, Shield, HeadphonesIcon } from "lucide-react";

const Footer = () => {
  const features = [
    { icon: Globe, label: "Global Shipping", desc: "Deliver to 190+ countries" },
    { icon: Shield, label: "Secure Payments", desc: "SSL encrypted checkout" },
    { icon: Truck, label: "Track Orders", desc: "Real-time order tracking" },
    { icon: HeadphonesIcon, label: "24/7 Support", desc: "Always here to help" },
  ];

  const sections = [
    { title: "Shop", links: ["All Products", "Categories", "Deals", "New Arrivals"] },
    { title: "Sell", links: ["Start Selling", "Seller Dashboard", "Pricing", "Resources"] },
    { title: "Support", links: ["Help Center", "Contact Us", "Returns", "Privacy Policy"] },
  ];

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="text-center">
                <Icon className="w-6 h-6 mx-auto mb-2 opacity-70" />
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs opacity-60">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-serif text-lg mb-3">GlobalMarketplace</h4>
            <p className="text-xs opacity-60 leading-relaxed">
              The global marketplace connecting artisans and creators with buyers worldwide.
            </p>
          </div>
          
          {sections.map((section) => (
            <div key={section.title}>
              <h5 className="text-sm font-semibold mb-3">{section.title}</h5>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs opacity-60 hover:opacity-100 transition-opacity">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center">
          <p className="text-xs opacity-40">© 2026 GlobalMarketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;