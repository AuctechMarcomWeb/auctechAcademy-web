import { InternshipList } from "@/components/internship/internship-list";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = {
  title: "Internships",
  description: "Mentored internships in engineering, marketing, analytics, design and cloud. Apply after completing the related course.",
};

export default function InternshipsPage() {
  return (
    <div className="container-x py-8 lg:py-12">
      <PageHeader
        eyebrow="Internship programmes"
        title="Internships"
        description="Mentored, project-based internships with attendance tracking, weekly tasks and a performance-reviewed certificate."
        className="mb-8"
      />
      <InternshipList />
    </div>
  );
}
