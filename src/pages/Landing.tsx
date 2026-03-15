import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { PoweredByFooter } from "@/components/brand/PoweredByFooter";
import { motion } from "framer-motion";
import {
  ScanLine, BarChart3, BellRing, Users, Shield, TrendingUp,
  MapPin, ChevronRight, CheckCircle2, Menu, X,
} from "lucide-react";
import churchPremises from "@/assets/church-premises.jpeg";
import { useState } from "react";

const features = [
  { icon: ScanLine, title: "Smart Attendance Capture", description: "QR-based check-in that makes attendance tracking seamless and accurate across all services." },
  { icon: BellRing, title: "Absentee Tracing", description: "Automatically identify members who haven't attended and trigger follow-up engagement workflows." },
  { icon: TrendingUp, title: "Growth Monitoring", description: "Track membership growth trends, retention rates, and participation patterns over time." },
  { icon: BarChart3, title: "Leadership Analytics", description: "Comprehensive dashboards giving pastors and leaders real-time insight into church health." },
  { icon: Users, title: "Engagement Visibility", description: "See at a glance which members are active, declining, or at risk of disengagement." },
  { icon: MapPin, title: "Multi-Location Support", description: "Manage attendance across states, regions, districts, and individual locations." },
];

const impacts = [
  "No member falls through the cracks",
  "Pastors get data-driven insight, not guesswork",
  "Follow-up teams know exactly who to visit",
  "Leadership can track growth across all locations",
  "Engagement trends help plan better outreach",
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="page-container flex items-center justify-between h-16">
          <Logo size="sm" />
          <div className="hidden md:flex items-center gap-6">
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#impact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Impact</a>
            <Link to="/login">
              <Button size="sm">Admin Login</Button>
            </Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
            <a href="#about" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>About</a>
            <a href="#features" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#impact" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Impact</a>
            <Link to="/login" className="block">
              <Button size="sm" className="w-full">Admin Login</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={churchPremises} alt="Deeper Life Bible Church premises" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
        </div>
        <div className="relative page-container py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold leading-tight text-primary-foreground">
              Church Attendance Intelligence System
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-primary-foreground/80 leading-relaxed">
              More than attendance. A complete platform for member engagement, absentee tracing, growth monitoring, and leadership analytics.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto gold-gradient border-0 text-primary-foreground font-semibold">
                  Access Admin Portal <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Explore Features
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 sm:py-24 bg-muted">
        <div className="page-container text-center max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold">
              Welcome to Deeper Life Bible Church
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              This system empowers church leadership with real-time visibility into attendance patterns,
              member engagement, and organizational health — enabling proactive pastoral care and
              data-driven decision making across every level of the church.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold">Why This System Matters</h2>
            <p className="mt-3 text-muted-foreground">
              Every feature is designed to solve real church challenges — from tracking who's absent to understanding growth trends across locations.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="stat-card group"
              >
                <div className="h-10 w-10 rounded-lg brand-gradient flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-bold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section id="impact" className="py-16 sm:py-24 bg-muted">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold">
                Real Impact for Church Leadership
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                This platform transforms raw attendance data into actionable intelligence
                that helps pastors, coordinators, and ministry leaders make informed decisions.
              </p>
              <ul className="mt-6 space-y-3">
                {impacts.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl overflow-hidden shadow-[var(--shadow-elevated)]">
              <img src={churchPremises} alt="Church community" className="w-full h-64 sm:h-80 object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 brand-gradient">
        <div className="page-container text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-primary-foreground">
            Ready to Transform Church Engagement?
          </h2>
          <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
            Access the admin portal to start managing attendance, tracking engagement, and empowering leadership with data-driven insights.
          </p>
          <Link to="/login" className="inline-block mt-8">
            <Button size="lg" className="gold-gradient border-0 text-primary-foreground font-semibold">
              Go to Admin Portal <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t">
        <div className="page-container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Deeper Life Bible Church. All rights reserved.
            </p>
          </div>
          <PoweredByFooter className="mt-4" />
        </div>
      </footer>
    </div>
  );
}
