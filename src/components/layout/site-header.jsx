"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/shared/logo";
import { UserAvatar } from "@/components/shared/user-avatar";
import { DemoBanner } from "@/components/shared/demo-banner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { authService } from "@/services/auth.service";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: ROUTES.home, label: "Home" },
  { href: ROUTES.explore, label: "Explore Courses" },
  { href: ROUTES.internships, label: "Internships" },
  { href: ROUTES.certifications, label: "Certifications" },
  { href: ROUTES.about, label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);

  const portalHref = user?.role === "admin" ? ROUTES.admin.dashboard : ROUTES.student.dashboard;

  const logout = async () => {
    await authService.logout();
    router.push(ROUTES.home);
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      <DemoBanner compact />
      <div className="border-b border-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
              {NAV.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-secondary",
                      active ? "text-secondary" : "text-foreground/80",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {hydrated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-card pl-1 pr-3 py-1 hover:bg-muted cursor-pointer">
                  <UserAvatar name={user.name} src={user.avatarUrl} className="h-8 w-8" />
                  <span className="text-sm font-medium max-w-[140px] truncate">{user.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-xs truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push(portalHref)}>
                    <LayoutDashboard /> {user.role === "admin" ? "Admin dashboard" : "My dashboard"}
                  </DropdownMenuItem>
                  {user.role === "student" && (
                    <DropdownMenuItem onSelect={() => router.push(ROUTES.student.profile)}>
                      <User /> My profile
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={logout}>
                    <LogOut /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href={ROUTES.login}>Login</Link>
                </Button>
                <Button asChild variant="accent">
                  <Link href={ROUTES.register}>Get Started</Link>
                </Button>
              </>
            )}
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="p-4 border-b border-border">
                <Logo size="sm" />
              </div>
              <nav className="flex flex-col p-2" aria-label="Mobile">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted",
                      pathname === item.href && "text-secondary bg-secondary/5",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto p-4 border-t border-border flex flex-col gap-2">
                {hydrated && user ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <UserAvatar name={user.name} className="h-8 w-8" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <Button asChild onClick={() => setOpen(false)}>
                      <Link href={portalHref}>Go to dashboard</Link>
                    </Button>
                    <Button variant="outline" onClick={logout}>
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" onClick={() => setOpen(false)}>
                      <Link href={ROUTES.login}>Login</Link>
                    </Button>
                    <Button asChild variant="accent" onClick={() => setOpen(false)}>
                      <Link href={ROUTES.register}>Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
