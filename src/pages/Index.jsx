import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroImg from "../assets/hero-marketplace.jpg";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { products, categories } from "../lib/mock-data.js";
import { Button } from "../components/ui/button.jsx";

const Index = () => {
  const featured = products.slice(0, 4);
  const trending = products.slice(4);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Global marketplace artisan products"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-lg"
          >
            <h1 className="font-serif text-4xl md:text-6xl text-primary-foreground leading-tight">
              Discover Unique Treasures Worldwide
            </h1>
            <p className="mt-4 text-primary-foreground/80 text-lg leading-relaxed">
              Connect with artisans and creators across 190+ countries. Every purchase tells a story.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/products">
                <Button size="lg" className="marketplace-gradient border-0 text-primary-foreground font-medium">
                  Shop Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/sell">
                <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Start Selling
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl text-foreground mb-8">Browse Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/products?category=${cat.id}`}
                className="flex flex-col items-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all group"
              >
                <span className="text-2xl mb-2">{cat.icon}</span>
                <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                <span className="text-[10px] text-muted-foreground">{cat.count.toLocaleString()} items</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-3xl text-foreground">Featured Finds</h2>
          <Link to="/products" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </section>

      {/* Banner */}
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-2xl marketplace-gradient p-8 md:p-14 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-primary-foreground mb-3">
            Turn Your Passion Into a Business
          </h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto mb-6">
            Join thousands of sellers reaching customers in 190+ countries. Low fees, powerful tools, global reach.
          </p>
          <Link to="/sell">
            <Button size="lg" className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-medium">
              Open Your Shop
            </Button>
          </Link>
        </div>
      </section>

      {/* Trending */}
      <section className="container mx-auto px-4 py-8 pb-16">
        <h2 className="font-serif text-3xl text-foreground mb-8">Trending Now</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {trending.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;