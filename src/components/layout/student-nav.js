import { Award, BarChart3, BookOpen, Briefcase, ClipboardList, CreditCard, FileCheck2, LayoutDashboard, Settings, User } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export const STUDENT_NAV = [
  {
    items: [
      { href: ROUTES.student.dashboard, label: "Dashboard", icon: LayoutDashboard },
      { href: ROUTES.student.myCourses, label: "My Courses", icon: BookOpen },
      { href: ROUTES.student.internships, label: "Internships", icon: Briefcase },
      { href: ROUTES.student.progress, label: "Progress", icon: BarChart3 },
    ],
  },
  {
    title: "Assessments",
    items: [
      { href: ROUTES.student.quizzes, label: "Quizzes", icon: ClipboardList },
      { href: ROUTES.student.assignments, label: "Assignments", icon: FileCheck2 },
      { href: ROUTES.student.certificates, label: "Certificates", icon: Award },
    ],
  },
  {
    title: "Account",
    items: [
      { href: ROUTES.student.payments, label: "Payment History", icon: CreditCard },
      { href: ROUTES.student.profile, label: "My Profile", icon: User },
      { href: ROUTES.student.settings, label: "Settings", icon: Settings },
    ],
  },
];
