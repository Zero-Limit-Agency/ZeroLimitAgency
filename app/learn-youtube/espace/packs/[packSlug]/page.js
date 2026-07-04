import Link from "next/link";
import { notFound } from "next/navigation";

import { styles } from "@/components/learn-youtube/space/training-shell";
import { getTrainingSpace, requireTrainingUser } from "@/lib/learn-youtube/training-data";

export const dynamic = "force-dynamic";

function pct(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

export default async function PackPage({ params }) {
  const user = await requireTrainingUser(`/learn-youtube/espace/packs/${params.packSlug}`);
  const space = await getTrainingSpace(user.id);
  const pack = space.packs.find((item) => item.slug === params.packSlug);

  if (!pack) {
    notFound();
  }

  const lessons = pack.modules.flatMap((module) => module.lessons);
  const done = lessons.filter((lesson) => lesson.progress?.status === "completed").length;
  const next = lessons.find((lesson) => lesson.progress?.status !== "completed") || lessons[0];

  return (
    <>
      <header className={styles.topbar}>
        <div>
          <p className={styles.kicker}>Pack accessible</p>
          <h1 className={styles.title}>{pack.title}</h1>
          <p className={styles.muted}>{pack.description || pack.short_description || "Structure du pack et avancement par module."}</p>
        </div>
        {next ? (
          <Link className={`${styles.button} ${styles.primary}`} href={`/learn-youtube/espace/lecons/${next.id}`}>
            Continuer
          </Link>
        ) : null}
      </header>

      <section className={`${styles.card} ${styles.full}`}>
        <p>{done} / {lessons.length} leçons terminées · {pct(done, lessons.length)}%</p>
        <div className={styles.progress}>
          <span className={styles.bar} style={{ width: `${pct(done, lessons.length)}%` }} />
        </div>

        {pack.modules.length ? (
          pack.modules.map((module) => {
            const moduleDone = module.lessons.filter((lesson) => lesson.progress?.status === "completed").length;

            return (
              <article className={styles.module} key={module.id}>
                <p className={styles.kicker}>{moduleDone}/{module.lessons.length} terminé</p>
                <h2>{module.title}</h2>
                <p className={styles.muted}>{module.description || "Module de formation."}</p>
                <div className={styles.progress}>
                  <span className={styles.bar} style={{ width: `${pct(moduleDone, module.lessons.length)}%` }} />
                </div>
                {module.lessons.length ? (
                  module.lessons.map((lesson) => (
                    <Link className={styles.lesson} key={lesson.id} href={`/learn-youtube/espace/lecons/${lesson.id}`}>
                      <span>{lesson.progress?.status === "completed" ? "✓ " : lesson.progress ? "◐ " : "○ "}{lesson.title}</span>
                      <span>{lesson.duration_seconds ? `${Math.round(lesson.duration_seconds / 60)} min` : "Durée à venir"}</span>
                    </Link>
                  ))
                ) : (
                  <p className={styles.empty}>Aucune leçon publiée dans ce module.</p>
                )}
              </article>
            );
          })
        ) : (
          <p className={styles.empty}>Aucun module publié dans ce pack.</p>
        )}
      </section>
    </>
  );
}
