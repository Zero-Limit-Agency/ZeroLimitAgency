import Link from "next/link";

import { SubmitButton } from "@/components/learn-youtube/space/training-actions";
import { styles } from "@/components/learn-youtube/space/training-shell";
import { requireLessonAccess, requireTrainingUser } from "@/lib/learn-youtube/training-data";

import { markLessonProgress, saveNote, toggleFavorite } from "../../actions";

export const dynamic = "force-dynamic";

export default async function LessonPage(props) {
  const params = await props.params;
  const user = await requireTrainingUser(`/learn-youtube/espace/lecons/${params.lessonId}`);
  const { lesson, module, pack } = await requireLessonAccess(user.id, params.lessonId);
  const orderedLessons = pack.modules.flatMap((item) => item.lessons);
  const lessonIndex = orderedLessons.findIndex((item) => item.id === lesson.id);
  const previousLesson = orderedLessons[lessonIndex - 1];
  const nextLesson = orderedLessons[lessonIndex + 1];

  return (
    <div className={styles.lessonLayout}>
      <section>
        <div className={styles.player} role="region" aria-label="Lecteur vidéo sécurisé">
          <div>
            <p className={styles.kicker}>Lecteur sécurisé</p>
            <h1>{lesson.title}</h1>
            <p className={styles.muted}>
              Placeholder prêt pour Mux ou Cloudflare Stream. Aucune vidéo YouTube publique n'est intégrée.
            </p>
          </div>
        </div>

        <article className={styles.card} style={{ marginTop: 16 }}>
          <p className={styles.kicker}>{pack.title} · {module.title}</p>
          <h2>Informations de leçon</h2>
          <p className={styles.muted}>{lesson.description || "Description à compléter dans le catalogue de formation."}</p>
          <p>
            Formateur : {lesson.trainer_name || "À renseigner"} · Progression :{" "}
            {lesson.progress?.status === "completed" ? "Terminée" : lesson.progress ? "En cours" : "Non commencée"}
          </p>
          <div className={styles.actions}>
            <form action={markLessonProgress}>
              <input type="hidden" name="lessonId" value={lesson.id} />
              <input type="hidden" name="status" value="completed" />
              <SubmitButton className={`${styles.button} ${styles.primary}`}>Marquer terminée</SubmitButton>
            </form>
            <form action={toggleFavorite}>
              <input type="hidden" name="lessonId" value={lesson.id} />
              <input type="hidden" name="active" value={lesson.isFavorite ? "1" : "0"} />
              <SubmitButton className={styles.button}>{lesson.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}</SubmitButton>
            </form>
            <Link className={styles.button} href={`/learn-youtube/espace/packs/${pack.slug}`}>Retour au pack</Link>
          </div>
        </article>

        <article className={styles.card} style={{ marginTop: 16 }}>
          <h2>Ressources</h2>
          {lesson.resources.length ? (
            lesson.resources.map((resource) => <p key={resource.id}>{resource.title} · {resource.resource_type}</p>)
          ) : (
            <p className={styles.empty}>Aucune ressource publiée pour cette leçon.</p>
          )}
        </article>

        <article className={styles.card} style={{ marginTop: 16 }}>
          <h2>Notes privées</h2>
          <form action={saveNote}>
            <input type="hidden" name="lessonId" value={lesson.id} />
            <label className={styles.muted} htmlFor="note-body">Votre note personnelle</label>
            <textarea id="note-body" name="body" className={styles.textarea} defaultValue={lesson.note?.body || ""} />
            <div style={{ marginTop: 10 }}>
              <SubmitButton className={styles.button}>Sauvegarder la note</SubmitButton>
            </div>
          </form>
        </article>

        <article className={styles.card} style={{ marginTop: 16 }}>
          <h2>Commentaires</h2>
          <p className={styles.empty}>
            Bientôt disponible : la base est prévue pour les commentaires modérés, sans faux échanges affichés.
          </p>
        </article>

        <nav className={styles.actions} style={{ marginTop: 16 }} aria-label="Navigation entre leçons">
          {previousLesson ? (
            <Link className={styles.button} href={`/learn-youtube/espace/lecons/${previousLesson.id}`}>← Leçon précédente</Link>
          ) : null}
          {nextLesson ? (
            <Link className={`${styles.button} ${styles.primary}`} href={`/learn-youtube/espace/lecons/${nextLesson.id}`}>
              Leçon suivante →
            </Link>
          ) : null}
        </nav>
      </section>

      <aside className={`${styles.card} ${styles.courseList}`}>
        <p className={styles.kicker}>Plan du cours</p>
        <h2>{pack.title}</h2>
        {pack.modules.map((item) => (
          <div className={styles.module} key={item.id}>
            <strong>{item.title}</strong>
            {item.lessons.map((courseLesson) => (
              <Link
                className={styles.lesson}
                key={courseLesson.id}
                href={`/learn-youtube/espace/lecons/${courseLesson.id}`}
                aria-current={courseLesson.id === lesson.id ? "page" : undefined}
              >
                <span>
                  {courseLesson.id === lesson.id ? "▶ " : courseLesson.progress?.status === "completed" ? "✓ " : "○ "}
                  {courseLesson.title}
                </span>
              </Link>
            ))}
          </div>
        ))}
      </aside>
    </div>
  );
}
