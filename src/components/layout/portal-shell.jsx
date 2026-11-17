"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronLeft, ExternalLink, LogOut, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { authService } from "@/services/auth.service";
import { APP_KIND, ROUTES, siteHref } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { STUDENT_NAV } from "./student-nav";
import { ADMIN_NAV } from "./admin-nav";

const NAVS = { student: STUDENT_NAV, admin: ADMIN_NAV };

function NavLinks({ groups, collapsed, onNavigate }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-5" aria-label="Portal">
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.title && !collapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">{group.title}</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-sidebar-active text-white" : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-accent" : "text-sidebar-muted group-hover:text-white")} />
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  {!collapsed && item.badge}
                </Link>
              );
              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function PortalShell({ portal, portalName, children, headerExtra }) {
  const groups = NAVS[portal];
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("auctech.sidebar") === "collapsed";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const user = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("auctech.sidebar", c ? "expanded" : "collapsed");
      } catch {}
      return !c;
    });
  };

  const logout = async () => {
    await authService.logout();
    router.push(ROUTES.login);
  };

  const current = groups.flatMap((g) => g.items).find((i) => (i.exact ? pathname === i.href : pathname.startsWith(i.href)));

  const sidebarInner = (onNavigate, isMobile = false) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-16 items-center border-b border-white/10 px-4", collapsed && !isMobile ? "justify-center" : "justify-between")}>
        <Logo variant="light" withWordmark={isMobile || !collapsed} size="sm" />
        {!isMobile && (
          <button
            onClick={toggle}
            className={cn(
              "hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-sidebar-muted hover:bg-white/10 hover:text-white cursor-pointer",
              collapsed && "absolute -right-3 top-5 bg-sidebar border border-white/10",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        )}
      </div>
      <NavLinks groups={groups} collapsed={collapsed && !isMobile} onNavigate={onNavigate} />
      <div className="border-t border-white/10 p-2">
        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-white/5 hover:text-white cursor-pointer",
            collapsed && !isMobile && "justify-center px-0",
          )}
        >
          <LogOut className="h-[18px] w-[18px] text-sidebar-muted" />
          {(!collapsed || isMobile) && "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden lg:block transition-[width] duration-200", collapsed ? "w-[72px]" : "w-64")}>
        {sidebarInner()}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 border-0">
          <SheetTitle className="sr-only">{portalName} navigation</SheetTitle>
          {sidebarInner(() => setMobileOpen(false), true)}
        </SheetContent>
      </Sheet>

      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <DemoBanner compact />
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white/90 backdrop-blur px-4 sm:px-6">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block">{portalName}</p>
            <h2 className="text-base font-semibold truncate leading-tight">{current?.label ?? portalName}</h2>
          </div>
          {headerExtra ?? (
            <div className="hidden md:flex items-center gap-2 rounded-md border border-border bg-card px-3 h-9 w-64 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <input
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                placeholder="Search…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = e.target.value;
                    window.open(siteHref(`${ROUTES.explore}?q=${encodeURIComponent(q)}`), APP_KIND === "admin" ? "_blank" : "_self");
                  }
                }}
              />
            </div>
          )}
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
          </Button>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <UserAvatar name={user.name} src={user.avatarUrl} className="h-9 w-9" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-xs truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => (APP_KIND === "admin" ? window.open(siteHref(ROUTES.home), "_blank") : router.push(ROUTES.home))}>
                  <ExternalLink /> View public site
                </DropdownMenuItem>
                {user.role === "student" && <DropdownMenuItem onSelect={() => router.push(ROUTES.student.profile)}>My profile</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={logout}>
                  <LogOut /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
