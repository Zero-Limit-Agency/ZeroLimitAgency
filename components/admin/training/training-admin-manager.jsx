"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const STATUS_OPTIONS = ["draft", "published", "archived"];
const RESOURCE_TYPES = ["pdf", "link", "file", "template", "checklist", "document"];
const ENTITLEMENT_STATUSES = ["active", "pending", "expired", "revoked"];

function emptyState(title, description) {
  return <article className="admin-empty-state"><strong>{title}</strong><p>{description}</p></article>;
}

function statusLabel(status) {
  return status === "published" ? "Publié" : status === "archived" ? "Archivé" : status === "Brouillon" ? status : "Brouillon";
}

function createDraft(values = {}) {
  return values;
}

function FormState({ state }) {
  if (!state.message) return null;
  return <p className={`admin-form-status admin-form-status-${state.status}`}>{state.message}</p>;
}

function Field({ label, children }) {
  return <label className="auth-field"><span>{label}</span>{children}</label>;
}

function SelectStatus({ value, onChange, statuses = STATUS_OPTIONS }) {
  return <select value={value || statuses[0]} onChange={(event) => onChange(event.target.value)}>{statuses.map((status) => <option value={status} key={status}>{status}</option>)}</select>;
}

function findById(items, id) {
  return items.find((item) => item.id === id) || null;
}

function buildPublicationWarnings({ program, pack, module, lesson }) {
  const warnings = [];
  if (pack?.status === "published" && program?.status !== "published") warnings.push("Ce pack est publié, mais son programme parent ne l'est pas.");
  if (module?.status === "published" && pack?.status !== "published") warnings.push("Ce module est publié, mais son pack parent ne l'est pas.");
  if (lesson?.status === "published" && module?.status !== "published") warnings.push("Cette leçon est publiée, mais son module parent ne l'est pas.");
  return warnings;
}

export function TrainingAdminManager({ initialModel }) {
  const [model, setModel] = useState(initialModel);
  const [state, setState] = useState({ status: "idle", message: "" });
  const [programDraft, setProgramDraft] = useState(() => createDraft(model.programs[0] || { title: "Formation YouTube", slug: "youtube", product_key: "training.youtube", status: "draft", sort_order: 1 }));
  const [packDraft, setPackDraft] = useState(() => createDraft({ program_id: model.programs[0]?.id || "", title: "", slug: "", product_key: "", short_description: "", description: "", status: "draft", sort_order: nextOrder(model.packs) }));
  const [moduleDraft, setModuleDraft] = useState(() => createDraft({ pack_id: model.packs[0]?.id || "", title: "", slug: "", description: "", status: "draft", sort_order: nextOrder(model.modules) }));
  const [lessonDraft, setLessonDraft] = useState(() => createDraft({ module_id: model.modules[0]?.id || "", title: "", slug: "", description: "", trainer_name: "", duration_seconds: 0, video_provider: "", video_asset_id: "", status: "draft", sort_order: nextOrder(model.lessons) }));
  const [resourceDraft, setResourceDraft] = useState(() => createDraft({ lesson_id: model.lessons[0]?.id || "", title: "", resource_type: "document", url: "", storage_path: "", status: "draft", sort_order: nextOrder(model.resources), is_downloadable: false }));
  const [accessDraft, setAccessDraft] = useState(() => createDraft({ user_id: "", program_id: model.programs[0]?.id || "", pack_id: "", product_key: "training.youtube", status: "active", starts_at: new Date().toISOString().slice(0, 10), expires_at: "", internal_note: "" }));
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState(model.users || []);

  const stats = useMemo(() => {
    const published = [...model.programs, ...model.packs, ...model.modules, ...model.lessons, ...model.resources].filter((item) => item.status === "published").length;
    return {
      packs: model.packs.length,
      modules: model.modules.length,
      lessons: model.lessons.length,
      published,
      activeAccess: model.entitlements.filter((item) => item.status === "active").length
    };
  }, [model]);

  if (!model.schemaReady) {
    return <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Migration requise</p><h2>Tables formation absentes</h2><p className="admin-inline-note">{model.schemaError}</p></div></div>{emptyState("Catalogue indisponible", "Appliquez la migration Supabase formation, puis revenez sur cette page.")}</section>;
  }

  async function submit(payload) {
    setState({ status: "loading", message: "Enregistrement formation en cours..." });
    try {
      const response = await fetch("/api/admin/formations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || "Modification impossible.");
      setState({ status: "success", message: result.message || "Modification enregistrée." });
      window.location.reload();
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Modification impossible." });
    }
  }

  async function searchUsers() {
    const response = await fetch(`/api/admin/formations?q=${encodeURIComponent(userQuery)}`);
    const result = await response.json().catch(() => null);
    setUserResults(result?.users || []);
  }

  const program = model.programs[0] || null;

  return <div className="admin-sections">
    <section className="admin-panel">
      <div className="admin-panel-heading"><div><p className="eyebrow">Formation</p><h2>Vue d'ensemble</h2><p className="admin-inline-note">Catalogue réel, sans contenu fictif.</p></div></div>
      <div className="admin-overview-grid">
        <article className="admin-subpanel"><small>Programmes</small><strong>{model.programs.length}</strong></article>
        <article className="admin-subpanel"><small>Packs</small><strong>{stats.packs}</strong></article>
        <article className="admin-subpanel"><small>Modules</small><strong>{stats.modules}</strong></article>
        <article className="admin-subpanel"><small>Leçons</small><strong>{stats.lessons}</strong></article>
        <article className="admin-subpanel"><small>Contenus publiés</small><strong>{stats.published}</strong></article>
        <article className="admin-subpanel"><small>Accès actifs</small><strong>{stats.activeAccess}</strong></article>
      </div>
      <div className="admin-actions admin-actions-inline"><Link className="button button-primary" href="/learn-youtube/espace">Ouvrir la preview admin</Link><a className="button button-dark" href="#acces">Gérer les accès</a></div>
      <FormState state={state} />
    </section>

    <section className="admin-panel">
      <div className="admin-panel-heading"><div><p className="eyebrow">Programme</p><h2>Programme Formation YouTube</h2><p className="admin-inline-note">Un seul programme prioritaire : training.youtube.</p></div></div>
      <div className="admin-meta-grid">
        <Field label="Titre"><input value={programDraft.title || ""} onChange={(e) => setProgramDraft({ ...programDraft, title: e.target.value })} /></Field>
        <Field label="Slug"><input value={programDraft.slug || ""} onChange={(e) => setProgramDraft({ ...programDraft, slug: e.target.value })} /></Field>
        <Field label="Clé produit"><input value={programDraft.product_key || ""} onChange={(e) => setProgramDraft({ ...programDraft, product_key: e.target.value })} /></Field>
        <Field label="Statut"><SelectStatus value={programDraft.status} onChange={(value) => setProgramDraft({ ...programDraft, status: value })} /></Field>
        <Field label="Ordre"><input type="number" value={programDraft.sort_order || 0} onChange={(e) => setProgramDraft({ ...programDraft, sort_order: e.target.value })} /></Field>
      </div>
      <Field label="Description"><textarea value={programDraft.description || ""} onChange={(e) => setProgramDraft({ ...programDraft, description: e.target.value })} /></Field>
      <button className="button button-primary" type="button" onClick={() => submit({ action: "save-program", ...programDraft })}>{program ? "Mettre à jour le programme" : "Créer le programme"}</button>
    </section>

    <CrudSection title="Packs" eyebrow="Catalogue" items={model.packs} empty="Aucun pack. Créez Montage, Graphisme, Monétisation ou Bases lorsque le contenu est prêt." onEdit={setPackDraft} render={(pack) => <PackRow pack={pack} model={model} submit={submit} onEdit={setPackDraft} />}>
      <PackForm draft={packDraft} setDraft={setPackDraft} programs={model.programs} submit={submit} />
    </CrudSection>

    <CrudSection title="Modules" eyebrow="Structure" items={model.modules} empty="Aucun module. Créez d'abord un pack puis ajoutez des modules." onEdit={setModuleDraft} render={(module) => <ModuleRow module={module} model={model} submit={submit} onEdit={setModuleDraft} />}>
      <ModuleForm draft={moduleDraft} setDraft={setModuleDraft} packs={model.packs} submit={submit} />
    </CrudSection>

    <CrudSection title="Leçons" eyebrow="Contenu" items={model.lessons} empty="Aucune leçon. Ajoutez des leçons sans brancher encore de lecteur vidéo." onEdit={setLessonDraft} render={(lesson) => <LessonRow lesson={lesson} model={model} submit={submit} onEdit={setLessonDraft} />}>
      <LessonForm draft={lessonDraft} setDraft={setLessonDraft} modules={model.modules} submit={submit} />
    </CrudSection>

    <CrudSection title="Ressources" eyebrow="Documents" items={model.resources} empty="Aucune ressource publiée ou brouillon." onEdit={setResourceDraft} render={(resource) => <ResourceRow resource={resource} model={model} submit={submit} onEdit={setResourceDraft} />}>
      <ResourceForm draft={resourceDraft} setDraft={setResourceDraft} lessons={model.lessons} submit={submit} />
    </CrudSection>

    <section className="admin-panel" id="acces">
      <div className="admin-panel-heading"><div><p className="eyebrow">Accès</p><h2>Attributions manuelles</h2><p className="admin-inline-note">Un compte seul ne donne aucun accès : attribuez un programme ou un pack.</p></div></div>
      <div className="admin-meta-grid"><Field label="Rechercher utilisateur"><input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="email, nom ou identifiant" /></Field><div className="admin-actions admin-actions-inline"><button className="button button-dark" type="button" onClick={searchUsers}>Rechercher</button></div></div>
      <div className="admin-list">{userResults.length ? userResults.map((user) => <article className="admin-list-card" key={user.id}><strong>{user.email || user.id}</strong><p className="admin-inline-note">{user.id}</p><button className="button button-dark button-compact" type="button" onClick={() => setAccessDraft({ ...accessDraft, user_id: user.id })}>Utiliser cet utilisateur</button></article>) : emptyState("Aucun résultat utilisateur", "Recherchez par email, nom ou identifiant Supabase Auth.")}</div>
      <EntitlementForm draft={accessDraft} setDraft={setAccessDraft} programs={model.programs} packs={model.packs} submit={submit} />
      <div className="admin-list">{model.entitlements.length ? model.entitlements.map((entitlement) => <EntitlementRow key={entitlement.id} entitlement={entitlement} model={model} submit={submit} />) : emptyState("Aucun accès manuel", "Les attributions apparaîtront ici après création.")}</div>
    </section>
  </div>;
}

function nextOrder(items) { return (items || []).length + 1; }
function CrudSection({ eyebrow, title, items, empty, render, children }) { return <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>{children}<div className="admin-list">{items.length ? items.map(render) : emptyState(title, empty)}</div></section>; }
function commonFields(draft, setDraft) { return <><Field label="Titre"><input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field><Field label="Slug"><input value={draft.slug || ""} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></Field><Field label="Statut"><SelectStatus value={draft.status} onChange={(value) => setDraft({ ...draft, status: value })} /></Field><Field label="Ordre"><input type="number" value={draft.sort_order || 0} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} /></Field></>; }
function PackForm({ draft, setDraft, programs, submit }) { return <div><div className="admin-meta-grid"><Field label="Programme"><select value={draft.program_id || ""} onChange={(e) => setDraft({ ...draft, program_id: e.target.value })}>{programs.map((p) => <option value={p.id} key={p.id}>{p.title}</option>)}</select></Field>{commonFields(draft, setDraft)}<Field label="Clé produit"><input value={draft.product_key || ""} onChange={(e) => setDraft({ ...draft, product_key: e.target.value })} /></Field></div><Field label="Description courte"><input value={draft.short_description || ""} onChange={(e) => setDraft({ ...draft, short_description: e.target.value })} /></Field><Field label="Description"><textarea value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field><button className="button button-primary" type="button" onClick={() => submit({ action: "save-pack", ...draft })}>Enregistrer le pack</button></div>; }
function ModuleForm({ draft, setDraft, packs, submit }) { return <div><div className="admin-meta-grid"><Field label="Pack"><select value={draft.pack_id || ""} onChange={(e) => setDraft({ ...draft, pack_id: e.target.value })}>{packs.map((p) => <option value={p.id} key={p.id}>{p.title}</option>)}</select></Field>{commonFields(draft, setDraft)}</div><Field label="Description"><textarea value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field><button className="button button-primary" type="button" onClick={() => submit({ action: "save-module", ...draft })}>Enregistrer le module</button></div>; }
function LessonForm({ draft, setDraft, modules, submit }) { return <div><div className="admin-meta-grid"><Field label="Module"><select value={draft.module_id || ""} onChange={(e) => setDraft({ ...draft, module_id: e.target.value })}>{modules.map((m) => <option value={m.id} key={m.id}>{m.title}</option>)}</select></Field>{commonFields(draft, setDraft)}<Field label="Durée (secondes)"><input type="number" value={draft.duration_seconds || 0} onChange={(e) => setDraft({ ...draft, duration_seconds: e.target.value })} /></Field><Field label="Formateur"><input value={draft.trainer_name || ""} onChange={(e) => setDraft({ ...draft, trainer_name: e.target.value })} /></Field><Field label="Provider vidéo futur"><input value={draft.video_provider || ""} onChange={(e) => setDraft({ ...draft, video_provider: e.target.value })} placeholder="mux, cloudflare..." /></Field><Field label="Asset vidéo futur"><input value={draft.video_asset_id || ""} onChange={(e) => setDraft({ ...draft, video_asset_id: e.target.value })} /></Field></div><Field label="Description"><textarea value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field><button className="button button-primary" type="button" onClick={() => submit({ action: "save-lesson", ...draft })}>Enregistrer la leçon</button></div>; }
function ResourceForm({ draft, setDraft, lessons, submit }) { return <div><div className="admin-meta-grid"><Field label="Leçon"><select value={draft.lesson_id || ""} onChange={(e) => setDraft({ ...draft, lesson_id: e.target.value })}>{lessons.map((l) => <option value={l.id} key={l.id}>{l.title}</option>)}</select></Field><Field label="Titre"><input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field><Field label="Type"><select value={draft.resource_type || "document"} onChange={(e) => setDraft({ ...draft, resource_type: e.target.value })}>{RESOURCE_TYPES.map((t) => <option value={t} key={t}>{t}</option>)}</select></Field><Field label="Statut"><SelectStatus value={draft.status} onChange={(value) => setDraft({ ...draft, status: value })} /></Field><Field label="Ordre"><input type="number" value={draft.sort_order || 0} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} /></Field></div><Field label="URL HTTPS"><input value={draft.url || ""} onChange={(e) => setDraft({ ...draft, url: e.target.value })} /></Field><Field label="Chemin stockage futur"><input value={draft.storage_path || ""} onChange={(e) => setDraft({ ...draft, storage_path: e.target.value })} /></Field><button className="button button-primary" type="button" onClick={() => submit({ action: "save-resource", ...draft })}>Enregistrer la ressource</button></div>; }
function EntitlementForm({ draft, setDraft, programs, packs, submit }) { return <div className="admin-subpanel"><div className="admin-meta-grid"><Field label="User ID"><input value={draft.user_id || ""} onChange={(e) => setDraft({ ...draft, user_id: e.target.value })} /></Field><Field label="Programme"><select value={draft.program_id || ""} onChange={(e) => setDraft({ ...draft, program_id: e.target.value, pack_id: "", product_key: "training.youtube" })}><option value="">Aucun</option>{programs.map((p) => <option value={p.id} key={p.id}>{p.title}</option>)}</select></Field><Field label="Pack"><select value={draft.pack_id || ""} onChange={(e) => { const pack = findById(packs, e.target.value); setDraft({ ...draft, pack_id: e.target.value, program_id: "", product_key: pack?.product_key || "" }); }}><option value="">Aucun</option>{packs.map((p) => <option value={p.id} key={p.id}>{p.title}</option>)}</select></Field><Field label="Statut"><SelectStatus statuses={ENTITLEMENT_STATUSES} value={draft.status} onChange={(value) => setDraft({ ...draft, status: value })} /></Field><Field label="Début"><input type="date" value={draft.starts_at || ""} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} /></Field><Field label="Expiration"><input type="date" value={draft.expires_at || ""} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })} /></Field></div><Field label="Note interne"><textarea value={draft.internal_note || ""} onChange={(e) => setDraft({ ...draft, internal_note: e.target.value })} /></Field><button className="button button-primary" type="button" onClick={() => submit({ action: "save-entitlement", ...draft })}>Attribuer l'accès</button></div>; }
function PackRow({ pack, model, submit, onEdit }) { const modules = model.modules.filter((m) => m.pack_id === pack.id); const lessons = model.lessons.filter((l) => modules.some((m) => m.id === l.module_id)); const warnings = buildPublicationWarnings({ program: findById(model.programs, pack.program_id), pack }); return <Record item={pack} meta={`${modules.length} modules · ${lessons.length} leçons`} warnings={warnings} preview={`/learn-youtube/espace/packs/${pack.slug}`} submit={submit} kind="pack" onEdit={onEdit} />; }
function ModuleRow({ module, model, submit, onEdit }) { const lessons = model.lessons.filter((l) => l.module_id === module.id); const pack = findById(model.packs, module.pack_id); const warnings = buildPublicationWarnings({ program: findById(model.programs, pack?.program_id), pack, module }); return <Record item={module} meta={`${pack?.title || "Pack manquant"} · ${lessons.length} leçons`} warnings={warnings} submit={submit} kind="module" onEdit={onEdit} />; }
function LessonRow({ lesson, model, submit, onEdit }) { const module = findById(model.modules, lesson.module_id); const pack = findById(model.packs, module?.pack_id); const warnings = buildPublicationWarnings({ program: findById(model.programs, pack?.program_id), pack, module, lesson }); return <Record item={lesson} meta={`${module?.title || "Module manquant"} · ${lesson.duration_seconds || 0}s`} warnings={warnings} preview={`/learn-youtube/espace/lecons/${lesson.id}`} submit={submit} kind="lesson" onEdit={onEdit} />; }
function ResourceRow({ resource, model, submit, onEdit }) { const lesson = findById(model.lessons, resource.lesson_id); return <Record item={resource} meta={`${lesson?.title || "Leçon manquante"} · ${resource.resource_type}`} warnings={[]} submit={submit} kind="resource" onEdit={onEdit} />; }
function EntitlementRow({ entitlement, model, submit }) { const scope = entitlement.program_id ? findById(model.programs, entitlement.program_id)?.title : findById(model.packs, entitlement.pack_id)?.title; return <article className="admin-list-card"><div><small>{entitlement.status}</small><h3>{scope || "Portée supprimée"}</h3><p className="admin-inline-note">{entitlement.user_id} · expire {entitlement.expires_at || "jamais"}</p></div><div className="admin-actions admin-actions-inline"><button className="button button-dark button-compact" type="button" onClick={() => submit({ action: "save-entitlement", ...entitlement, status: entitlement.status === "active" ? "revoked" : "active" })}>{entitlement.status === "active" ? "Désactiver" : "Réactiver"}</button></div></article>; }
function Record({ item, meta, warnings, preview, submit, kind, onEdit }) { return <article className="admin-list-card"><div><small>{item.status}</small><h3>{item.title}</h3><p className="admin-inline-note">{meta} · ordre {item.sort_order ?? 0}</p>{warnings.map((w) => <p className="admin-inline-note" key={w}>⚠ {w}</p>)}</div><div className="admin-actions admin-actions-inline"><button className="button button-dark button-compact" type="button" onClick={() => onEdit?.(item)}>Modifier</button>{preview ? <Link className="button button-dark button-compact" href={preview}>Preview</Link> : null}<button className="button button-dark button-compact" type="button" onClick={() => submit({ action: "archive", kind, id: item.id })}>Archiver</button></div></article>; }
