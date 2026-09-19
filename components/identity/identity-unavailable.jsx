export function IdentityUnavailable({ correlationId }) {
  return (
    <main className="identity-shell">
      <section className="identity-card" aria-labelledby="identity-unavailable-title">
        <p className="eyebrow">Zero Limit ID</p>
        <h1 id="identity-unavailable-title">Service momentanément indisponible</h1>
        <p>
          Votre session reste sécurisée, mais votre profil ne peut pas être chargé. Réessayez après
          vérification de la configuration de l’environnement.
        </p>
        <p className="identity-hint">Référence : {correlationId}</p>
      </section>
    </main>
  );
}
