import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FolderTree,
  Layers,
  LayoutDashboard,
  PlaySquare,
  Settings,
  UserCheck,
  Users,
  Video,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

export const ADMIN_NAV = [
  {
    items: [{ href: ROUTES.admin.dashboard, label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Catalogue",
    items: [
      { href: ROUTES.admin.courses, label: "Courses", icon: BookOpen },
      { href: ROUTES.admin.categories, label: "Categories", icon: FolderTree },
      { href: ROUTES.admin.modules, label: "Modules", icon: Layers },
      { href: ROUTES.admin.lessons, label: "Lessons", icon: PlaySquare },
      { href: ROUTES.admin.videos, label: "Videos", icon: Video },
    ],
  },
  {
    title: "Learners",
    items: [
      { href: ROUTES.admin.students, label: "Students", icon: Users },
      { href: ROUTES.admin.enrollments, label: "Enrollments", icon: UserCheck },
      { href: ROUTES.admin.orders, label: "Payments", icon: CreditCard },
    ],
  },
  {
    title: "Assessment",
    items: [
      { href: ROUTES.admin.quizzes, label: "Quizzes", icon: ClipboardList },
      { href: ROUTES.admin.assignments, label: "Assignments", icon: FileCheck2 },
      { href: ROUTES.admin.internships, label: "Internships", icon: Briefcase },
      { href: ROUTES.admin.certificates, label: "Certificates", icon: Award },
    ],
  },
  {
    title: "System",
    items: [
      { href: ROUTES.admin.analytics, label: "Analytics", icon: BarChart3 },
      { href: ROUTES.admin.settings, label: "Settings", icon: Settings },
    ],
  },
];
