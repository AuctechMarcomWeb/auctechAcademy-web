"use client";

import * as React from "react";
import Link from "next/link";
import { Award, Briefcase, CalendarCheck, CheckCircle2, ClipboardCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useDb } from "@/store/db.store";
import { internshipService } from "@/services/internship.service";
import { formatDate } from "@/lib/format";
import { ROUTES } from "@/lib/constants";

export default function StudentInternshipsPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const applications = useDb((s) => s.internshipApplications);
  const internships = useDb((s) => s.internships);
  const [busy, setBusy] = React.useState();
  if (!hydrated || !user) return <PageSkeleton />;

  const mine = applications.filter((a) => a.userId === user.id).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  const activeApps = mine.filter((a) => a.status === "active" || a.status === "completed");
  const internshipOf = (id) => internships.find((i) => i.id === id);

  const markSubmitted = async (appId, taskId) => {
    setBusy(taskId);
    try {
      await internshipService.updateTask(appId, taskId, { status: "submitted", submittedAt: new Date().toISOString() });
      toast.success("Task marked as submitted — your mentor will review it");
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internships"
        description="Your applications, active internship tasks and performance."
        actions={
          <Button asChild variant="outline">
            <Link href={ROUTES.internships}>
              <Briefcase /> Browse internships
            </Link>
          </Button>
        }
      />
      <Tabs defaultValue={activeApps.length ? "active" : "applications"}>
        <TabsList>
          <TabsTrigger value="applications">Applications ({mine.length})</TabsTrigger>
          <TabsTrigger value="active">Active internship ({activeApps.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="applications">
          {mine.length ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Internship</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mine.map((a) => {
                    const i = internshipOf(a.internshipId);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          {i ? (
                            <Link href={ROUTES.internship(i.slug)} className="hover:text-secondary">
                              {i.title}
                            </Link>
                          ) : (
                            a.internshipId
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{i?.department}</TableCell>
                        <TableCell>{formatDate(a.appliedAt)}</TableCell>
                        <TableCell>{a.mentor ?? "—"}</TableCell>
                        <TableCell>
                          <StatusBadge status={a.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No applications yet"
              description="Apply to an internship to see your application status here."
              action={
                <Button asChild>
                  <Link href={ROUTES.internships}>Browse internships</Link>
                </Button>
              }
            />
          )}
        </TabsContent>
        <TabsContent value="active" className="space-y-6">
          {activeApps.length ? (
            activeApps.map((a) => {
              const i = internshipOf(a.internshipId);
              const done = a.tasks.filter((t) => t.status === "approved").length;
              const attendancePct = a.attendance ? Math.round((a.attendance.present / a.attendance.total) * 100) : 0;
              return (
                <div key={a.id} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{i?.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {i?.department} · {i?.durationWeeks} weeks · {i?.workMode}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Assigned mentor" value={<span className="text-base">{a.mentor ?? "Pending"}</span>} icon={UserCheck} />
                    <StatCard
                      label="Attendance"
                      value={a.attendance ? `${attendancePct}%` : "—"}
                      icon={CalendarCheck}
                      tone="success"
                      hint={a.attendance ? `${a.attendance.present} of ${a.attendance.total} sessions` : undefined}
                    />
                    <StatCard label="Tasks approved" value={`${done} / ${a.tasks.length}`} icon={ClipboardCheck} tone="accent" />
                    <StatCard label="Performance" value={a.performanceScore ? `${a.performanceScore}%` : "—"} icon={CheckCircle2} tone="primary" />
                  </div>
                  <Card>
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <p className="font-semibold text-sm">Tasks & submitted work</p>
                      <div className="flex items-center gap-2 w-40">
                        <Progress value={a.tasks.length ? (done / a.tasks.length) * 100 : 0} />
                      </div>
                    </div>
                    {a.tasks.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Due</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Feedback</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {a.tasks.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell className="font-medium">{t.title}</TableCell>
                              <TableCell className="whitespace-nowrap">{formatDate(t.dueDate)}</TableCell>
                              <TableCell>
                                <StatusBadge status={t.status} />
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-[260px]">{t.feedback ?? "—"}</TableCell>
                              <TableCell className="text-right">
                                {(t.status === "todo" || t.status === "in_progress") && (
                                  <Button size="sm" variant="outline" loading={busy === t.id} onClick={() => markSubmitted(a.id, t.id)}>
                                    Mark submitted
                                  </Button>
                                )}
                                {t.status === "submitted" && <span className="text-xs text-muted-foreground">Awaiting review</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-4">
                        <EmptyState compact title="No tasks assigned yet" />
                      </div>
                    )}
                  </Card>
                  <Card className="p-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Award className="h-6 w-6 text-accent" />
                      <div>
                        <p className="font-semibold text-sm">Internship certificate</p>
                        <p className="text-xs text-muted-foreground">
                          {a.status === "completed"
                            ? a.certificateId
                              ? `Issued: ${a.certificateId}`
                              : "Completion confirmed — certificate pending"
                            : "Issued after completion and mentor sign-off."}
                        </p>
                      </div>
                    </div>
                    {a.certificateId && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={ROUTES.student.certificates}>View certificate</Link>
                      </Button>
                    )}
                  </Card>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No active internship"
              description="Once you are selected, your mentor, tasks and attendance appear here."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
