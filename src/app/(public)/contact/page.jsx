import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ContactForm } from "@/components/static/contact-form";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: "Contact",
  description: "Get in touch with the Auctech Academy team about courses, internships, certificates or payments.",
};

export default function ContactPage() {
  return (
    <div className="container-x py-8 lg:py-12">
      <PageHeader
        eyebrow="Contact"
        title="We're here to help"
        description="Questions about a course, an application or a certificate? Send us a message."
        className="mb-8"
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-border bg-card p-6">
          <ContactForm />
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 text-sm">
            <div className="flex gap-3">
              <Mail className="h-5 w-5 text-secondary shrink-0" />
              <div>
                <p className="font-medium">Email</p>
                <a href={`mailto:${SITE.supportEmail}`} className="text-muted-foreground hover:text-foreground">
                  {SITE.supportEmail}
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="h-5 w-5 text-secondary shrink-0" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-muted-foreground">{SITE.phone}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 text-secondary shrink-0" />
              <div>
                <p className="font-medium">Office</p>
                <p className="text-muted-foreground">{SITE.address}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-secondary shrink-0" />
              <div>
                <p className="font-medium">Support hours</p>
                <p className="text-muted-foreground">Mon – Sat, 10:00 – 18:00 IST</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-primary text-white p-5 text-sm">
            <p className="font-semibold">Verifying a certificate?</p>
            <p className="mt-1 text-slate-300">You don&apos;t need to contact us — use the public verification page with the certificate ID.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
