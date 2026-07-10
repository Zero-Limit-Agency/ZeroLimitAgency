import Link from "next/link";

import { styles } from "@/components/learn-youtube/space/training-shell";
import { findNextLesson, getTrainingSpace, requireTrainingUser } from "@/lib/learn-youtube/training-data";

export const dynamic = "force-dynamic";

function pct(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

export default async function TrainingDashboard() {
  const user = await requireTrainingUser("/learn-youtube/espace");
  const space = await getTrainingSpace(user.id);
  const next = findNextLesson(space);

  return (
    <>
      <header className={styles.topbar}>
        <div>
          <p className={styles.kicker}>Espace formation privé</p>
          <h1 className={styles.title}>Bienvenue{user.email ? ` ${user.email.split("@")[0]}` : ""}</h1>
          <p className={styles.muted}>
            Votre compte seul ne débloque pas la formation : seuls les packs attribués apparaissent ici.
          </p>
        </div>
        <div aria-label={`Progression globale ${space.globalProgress}%`}>
          <strong>{space.globalProgress}%</strong>
          <div className={styles.progress}>
            <span className={styles.bar} style={{ width: `${space.globalProgress}%` }} />
          </div>
        </div>
      </header>

      <section className={styles.grid}>
        {!space.program ? (
          <div className={`${styles.card} ${styles.full}`}>
            <h2>Catalogue formation non initialisé</h2>
            <p className={styles.muted}>La base est prête, mais aucun programme Formation YouTube publié n'existe encore.</p>
          </div>
        ) : null}

        {space.program && space.packs.length === 0 ? (
          <div className={`${styles.card} ${styles.full}`}>
            <h2>Aucun pack accessible</h2>
            <p className={styles.muted}>
              Votre compte est connecté, mais aucun entitlement Formation YouTube actif ne lui est associé.
            </p>
          </div>
        ) : null}

        {next ? (
          <article className={`${styles.card} ${styles.wide}`}>
            <p className={styles.kicker}>Continuer ma formation</p>
            <h2>{next.title}</h2>
            <p className={styles.muted}>
              {next.description || "Leçon prête à être consultée dès que le contenu vidéo sécurisé est branché."}
            </p>
            <Link className={`${styles.button} ${styles.primary}`} href={`/learn-youtube/espace/lecons/${next.id}`}>
              Reprendre
            </Link>
          </article>
        ) : null}

        <aside className={`${styles.card} ${styles.side}`}>
          <p className={styles.kicker}>Vue d'ensemble</p>
          <p><strong>{space.completedLessons}</strong> / {space.totalLessons} leçons terminées</p>
          <p><strong>{space.resources.length}</strong> ressources disponibles</p>
          <p><strong>{space.favorites.length}</strong> favoris</p>
          <p><strong>{space.notes.length}</strong> notes privées</p>
        </aside>

        <div className={`${styles.card} ${styles.full}`} id="packs">
          <h2>Mes packs</h2>
          <div className={styles.packs}>
            {space.packs.map((pack) => {
              const lessons = pack.modules.flatMap((module) => module.lessons);
              const done = lessons.filter((lesson) => lesson.progress?.status === "completed").length;

              return (
                <article className={styles.pack} key={pack.id}>
                  <p className={styles.kicker}>{pack.modules.length} modules · {lessons.length} leçons</p>
                  <h3>{pack.title}</h3>
                  <p className={styles.muted}>{pack.short_description || pack.description || "Pack accessible."}</p>
                  <div className={styles.progress}>
                    <span className={styles.bar} style={{ width: `${pct(done, lessons.length)}%` }} />
                  </div>
                  <p>{pct(done, lessons.length)}% terminé</p>
                  <Link className={styles.button} href={`/learn-youtube/espace/packs/${pack.slug}`}>
                    {done ? "Continuer" : "Commencer"}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>

        <div className={`${styles.card} ${styles.wide}`} id="favoris">
          <h2>Favoris</h2>
          {space.lessons.filter((lesson) => lesson.isFavorite).length ? (
            space.lessons
              .filter((lesson) => lesson.isFavorite)
              .map((lesson) => (
                <Link className={styles.lesson} key={lesson.id} href={`/learn-youtube/espace/lecons/${lesson.id}`}>
                  {lesson.title}<span>★</span>
                </Link>
              ))
          ) : (
            <p className={styles.empty}>Aucun favori pour le moment.</p>
          )}
        </div>

        <div className={`${styles.card} ${styles.side}`} id="notes">
          <h2>Notes récentes</h2>
          {space.notes.length ? (
            space.notes.slice(0, 4).map((note) => <p key={note.id} className={styles.muted}>{note.body.slice(0, 90)}</p>)
          ) : (
            <p className={styles.empty}>Aucune note privée enregistrée.</p>
          )}
        </div>
      </section>
    </>
  );
}
