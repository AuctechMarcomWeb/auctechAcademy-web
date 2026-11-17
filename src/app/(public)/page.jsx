import { Hero } from "@/components/home/hero";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { FeaturedCourses } from "@/components/home/featured-courses";
import { InternshipPrograms } from "@/components/home/internship-programs";
import { HowItWorks, WhyChoose } from "@/components/home/why-and-how";
import { StudentSuccess, Testimonials } from "@/components/home/success-and-testimonials";
import { HomeFaq } from "@/components/home/home-faq";

export const metadata = {
  title: "Auctech Academy — Learn Skills. Build Careers. Get Certified.",
  description:
    "Online courses, internships and assessment-based professional certification from Auctech. Structured learning, practical assignments and verifiable certificates.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoriesGrid />
      <FeaturedCourses />
      <InternshipPrograms />
      <WhyChoose />
      <HowItWorks />
      <StudentSuccess />
      <Testimonials />
      <HomeFaq />
    </>
  );
}
