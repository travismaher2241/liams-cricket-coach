import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlayerView } from "@/lib/auth";
import { LESSON_BY_ID } from "@/content/mind";
import { LessonRunner } from "@/components/Mind";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { player } = await requirePlayerView();
  const lesson = LESSON_BY_ID[id];
  if (!lesson) notFound();
  return (
    <main className="flex flex-col gap-4">
      <Link href="/play/mind" className="text-sm text-muted">‹ Back</Link>
      <h1 className="h-display text-3xl">{lesson.icon} {lesson.title}</h1>
      <LessonRunner lesson={lesson} word={player.mindWord ?? null} />
    </main>
  );
}
