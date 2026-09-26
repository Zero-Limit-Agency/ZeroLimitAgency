"use client";

export default function WorkspaceError({ reset }) {
  return <main className="workspace-state" role="alert">
    <p className="space-kind">Zero Limit</p>
    <h1>Un instant, s’il vous plaît.</h1>
    <p>Votre espace n’a pas pu être affiché. Vos données n’ont pas été modifiées.</p>
    <button className="workspace-button workspace-button-secondary" type="button" onClick={() => reset()}>Réessayer</button>
  </main>;
}
