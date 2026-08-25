import Link from "next/link";
import { Icon } from "./icons";

export function Button({ href, variant = "primary", size = "md", children, className = "", ...props }) {
  const classes = `zl-button zl-button--${variant} zl-button--${size} ${className}`.trim();
  return href ? <Link href={href} className={classes} {...props}>{children}</Link> : <button className={classes} {...props}>{children}</button>;
}
export function IconButton({ label, icon, ...props }) { return <button className="zl-icon-button" aria-label={label} {...props}><Icon name={icon}/></button>; }
export function Badge({ children, tone = "soft" }) { return <span className={`zl-badge zl-badge--${tone}`}>{children}</span>; }
export function SectionHeading({ eyebrow, title, copy, align = "left", id }) { return <header className={`zl-section-heading zl-section-heading--${align}`}><Badge>{eyebrow}</Badge><h2 id={id}>{title}</h2>{copy && <p>{copy}</p>}</header>; }
export function Card({ as: Component = "article", className = "", children }) { return <Component className={`zl-card ${className}`}>{children}</Component>; }
export function FeatureCard({ icon, title, children, index }) { return <Card className="zl-feature-card">{index && <span className="zl-card-index">{index}</span>}<span className="zl-feature-icon"><Icon name={icon}/></span><h3>{title}</h3><p>{children}</p></Card>; }
export function StatCard({ value, label, note }) { return <Card className="zl-stat-card"><strong>{value}</strong><span>{label}</span>{note && <small>{note}</small>}</Card>; }
export function TestimonialCard({ title, children }) { return <Card className="zl-testimonial-card"><Badge tone="outline">{title}</Badge><div className="zl-testimonial-body">{children}</div></Card>; }
export function PricingCard({ name, price, description, features, featured, cta }) { return <Card className={`zl-pricing-card ${featured ? "is-featured" : ""}`}>{featured && <Badge tone="accent">Recommandé</Badge>}<h3>{name}</h3><p>{description}</p><strong className="zl-price">{price}</strong><ul>{features.map((item) => <li key={item}><Icon name="check" size={17}/>{item}</li>)}</ul><Button href="#contact" variant={featured ? "primary" : "secondary"}>{cta}</Button></Card>; }
export function MediaFrame({ label = "Aperçu produit", compact = false }) { return <div className={`zl-media-frame ${compact ? "is-compact" : ""}`} role="img" aria-label={label}><div className="zl-window-bar"><i/><i/><i/><span>Zero Limit OS</span></div><div className="zl-product-shell"><aside><div className="zl-mini-logo">ZL</div>{[1,2,3,4].map(n => <i key={n}/>)}</aside><div className="zl-product-main"><span className="zl-product-label">APERÇU · DONNÉES DE DÉMONSTRATION</span><h3>Pilotez votre progression.</h3><div className="zl-preview-grid"><div className="zl-preview-chart"><span>Activité · cette semaine</span><b>Étape 3/5</b><svg viewBox="0 0 300 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 75 C40 64 50 72 85 48 S145 58 175 31 230 48 300 10"/></svg></div><div className="zl-preview-list"><span>Prochaines étapes</span><i/><i/><i/></div></div></div></div></div>; }
