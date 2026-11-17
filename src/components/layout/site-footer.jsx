import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ROUTES, SITE } from "@/lib/constants";

const COLUMNS = [
  {
    title: "Academy",
    links: [
      { href: ROUTES.about, label: "About" },
      { href: ROUTES.explore, label: "Courses" },
      { href: ROUTES.internships, label: "Internships" },
      { href: ROUTES.certifications, label: "Certifications" },
      { href: ROUTES.pricing, label: "Pricing" },
      { href: ROUTES.contact, label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/refund-policy", label: "Refund Policy" },
    ],
  },
  {
    title: "Verify",
    links: [
      { href: ROUTES.verify, label: "Certificate Verification" },
      { href: ROUTES.login, label: "Student Login" },
      { href: ROUTES.register, label: "Create Account" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-primary text-slate-300">
      <div className="container-x py-12 grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo variant="light" />
          <p className="text-sm leading-relaxed text-slate-400 max-w-sm">{SITE.description}</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" />
              <a href={`mailto:${SITE.supportEmail}`} className="hover:text-white">
                {SITE.supportEmail}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-accent" /> {SITE.phone}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-accent mt-0.5" /> <span>{SITE.address}</span>
            </li>
          </ul>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-white mb-3">{col.title}</h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} Auctech. All rights reserved. {SITE.domain}
          </p>
          <p>{SITE.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
