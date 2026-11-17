import Image from "next/image";
import Link from "next/link";
import { Building2, CalendarClock, Clock, MapPin, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatINR } from "@/lib/format";
import { ROUTES } from "@/lib/constants";

export function stipendLabel(i) {
  if (i.stipend === "Paid" && i.stipendAmount) return `${formatINR(i.stipendAmount)}/month`;
  return i.stipend;
}

export function InternshipCard({ internship }) {
  const href = ROUTES.internship(internship.slug);
  const closed = internship.status !== "open" || new Date(internship.applicationDeadline) < new Date();
  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-card-hover">
      <Link href={href} className="relative block aspect-[2/1]">
        <Image src={internship.thumbnail} alt="" fill loading="eager" className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant={closed ? "muted" : "success"} className="bg-white/95">
            {closed ? "Closed" : "Open"}
          </Badge>
          <Badge variant="outline" className="bg-white/95 border-transparent">
            {internship.workMode}
          </Badge>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 gap-3">
        <div>
          <p className="text-xs font-medium text-secondary inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" /> {internship.department}
          </p>
          <Link href={href}>
            <h3 className="mt-1 font-semibold leading-snug hover:text-secondary">{internship.title}</h3>
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <li className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {internship.durationWeeks} weeks
          </li>
          <li className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {internship.workMode}
          </li>
          <li className="inline-flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5" /> {stipendLabel(internship)}
          </li>
          <li className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" /> {formatDate(internship.applicationDeadline)}
          </li>
        </ul>
        <p className="text-xs text-muted-foreground line-clamp-2">
          <span className="font-medium text-foreground">Eligibility:</span> {internship.eligibility[0]}
        </p>
        <div className="mt-auto pt-2">
          <Button asChild className="w-full" variant={closed ? "outline" : "default"}>
            <Link href={href}>{closed ? "View details" : "Apply Now"}</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
