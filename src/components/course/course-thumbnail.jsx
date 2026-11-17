import Image from "next/image";
import { cn } from "@/lib/utils";

export function CourseThumbnail({ src, alt, className, sizes = "200px" }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted aspect-video", className)}>
      <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} />
    </div>
  );
}
