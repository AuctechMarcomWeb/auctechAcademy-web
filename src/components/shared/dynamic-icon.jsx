import { BookOpen, Braces, BrainCircuit, Briefcase, Code2, Megaphone, MonitorCog, Palette, Search } from "lucide-react";

const ICONS = { BookOpen, Braces, BrainCircuit, Briefcase, Code2, Megaphone, MonitorCog, Palette, Search };

/** Resolves a category icon name from mock data to a Lucide component (tree-shake friendly). */
export function DynamicIcon({ name, ...props }) {
  const Icon = ICONS[name] ?? BookOpen;
  return <Icon {...props} />;
}
