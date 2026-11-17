import { BookOpen, Star, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";

export function InstructorCard({ instructor }) {
  return (
    <Card className="p-5 flex flex-col sm:flex-row gap-4">
      <UserAvatar name={instructor.name} src={instructor.avatarUrl} className="h-16 w-16 text-lg" />
      <div className="min-w-0">
        <h3 className="text-lg font-semibold">{instructor.name}</h3>
        <p className="text-sm text-secondary font-medium">{instructor.title}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-500" /> {instructor.rating.toFixed(1)} instructor rating
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {instructor.students.toLocaleString("en-IN")} students
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> {instructor.courses} courses
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{instructor.bio}</p>
      </div>
    </Card>
  );
}
