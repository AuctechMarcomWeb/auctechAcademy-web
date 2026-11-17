import { serverGet } from "@/lib/server-api";
import { InternshipDetail } from "@/components/internship/internship-detail";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const i = await serverGet(`/internships/${encodeURIComponent(slug)}`);
  return i ? { title: i.title, description: i.description } : { title: "Internship" };
}

export default async function InternshipPage({ params }) {
  const { slug } = await params;
  return <InternshipDetail slug={slug} />;
}
