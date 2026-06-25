import Link from "next/link";

import styles from "./editorial-compositions.module.css";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function EditorialShell({ as: Component = "main", className = "", children }) {
  return <Component className={cx(styles.shell, className)}>{children}</Component>;
}

export function SectionEyebrow({ children, className = "" }) {
  return <span className={cx(styles.eyebrow, className)}>{children}</span>;
}

export function SectionHeader({ eyebrow, title, description, align = "center", action = null, className = "" }) {
  return (
    <div className={cx(styles.sectionHeader, align === "left" && styles.sectionHeaderLeft, className)}>
      {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action?.href && action?.label ? (
        <Link className={styles.primaryLink} href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function EditorialHero({ eyebrow, title, description, primaryAction, secondaryAction, visual, meta = [], className = "" }) {
  return (
    <section className={cx(styles.hero, className)}>
      <div className={styles.heroCopy}>
        {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
        <div className={styles.actions}>
          {primaryAction?.href ? <Link className={styles.primaryLink} href={primaryAction.href}>{primaryAction.label}</Link> : null}
          {secondaryAction?.href ? <Link className={styles.secondaryLink} href={secondaryAction.href}>{secondaryAction.label}</Link> : null}
        </div>
      </div>
      {visual ? <div className={styles.heroVisual}>{visual}</div> : null}
      {meta.length > 0 ? (
        <div className={styles.metaRail} aria-label="Points clés">
          {meta.map((item) => <span key={item}>{item}</span>)}
        </div>
      ) : null}
    </section>
  );
}

export function SplitSection({ eyebrow, title, description, children, reverse = false, className = "" }) {
  return (
    <section className={cx(styles.section, styles.splitSection, reverse && styles.reverse, className)}>
      <SectionHeader eyebrow={eyebrow} title={title} description={description} align="left" />
      <div className={styles.splitMedia}>{children}</div>
    </section>
  );
}

export function ImmersiveSection({ eyebrow, title, description, children, className = "" }) {
  return (
    <section className={cx(styles.section, styles.immersive, className)}>
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      {children ? <div className={styles.immersiveBody}>{children}</div> : null}
    </section>
  );
}

export function EditorialGrid({ children, className = "" }) {
  return <div className={cx(styles.grid, className)}>{children}</div>;
}

export function GlassFeatureCard({ eyebrow, title, description, children, className = "" }) {
  return (
    <article className={cx(styles.card, className)}>
      {eyebrow ? <small>{eyebrow}</small> : null}
      {title ? <h3>{title}</h3> : null}
      {description ? <p>{description}</p> : null}
      {children}
    </article>
  );
}

export function VisualShowcase({ label = "Zero Limit", title, children, className = "" }) {
  return (
    <div className={cx(styles.showcase, className)}>
      <div className={styles.showcaseTopbar}><span /><span /><span /><strong>{label}</strong></div>
      <div className={styles.showcaseBody}>
        {title ? <strong>{title}</strong> : null}
        {children}
      </div>
    </div>
  );
}

export function FeatureRail({ items = [], className = "" }) {
  if (!items.length) return null;
  return <div className={cx(styles.featureRail, className)}>{items.map((item) => <span key={item}>{item}</span>)}</div>;
}

export function LargeCTASection({ eyebrow, title, description, primaryAction, secondaryAction, className = "" }) {
  return (
    <section className={cx(styles.largeCta, className)}>
      {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      <div className={styles.actions}>
        {primaryAction?.href ? <Link className={styles.primaryLink} href={primaryAction.href}>{primaryAction.label}</Link> : null}
        {secondaryAction?.href ? <Link className={styles.secondaryLink} href={secondaryAction.href}>{secondaryAction.label}</Link> : null}
      </div>
    </section>
  );
}

export function ProductInterfaceMock({ title = "Zero Limit", steps = [], children }) {
  return (
    <VisualShowcase label={title}>
      <div className={styles.interfaceMock}>
        <div className={styles.interfaceCanvas}>{children || <span>Expérience en préparation</span>}</div>
        {steps.length > 0 ? <ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol> : null}
      </div>
    </VisualShowcase>
  );
}

export function DashboardComposition({ eyebrow, title, description, actions, children, className = "" }) {
  return (
    <main className={cx(styles.dashboardShell, className)}>
      <section className={styles.dashboardFrame}>
        <header className={styles.dashboardHeader}>
          <div>
            {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className={styles.dashboardActions}>{actions}</div> : null}
        </header>
        {children}
      </section>
    </main>
  );
}
