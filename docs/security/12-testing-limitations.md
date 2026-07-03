# 12 — Commandes, tests, limites et faux positifs

## Commandes exécutées

| Commande | Résultat | Notes |
| --- | --- | --- |
| `find .. -name AGENTS.md -print` | Succès | Instructions repo lues |
| `rg --files -g '!*node_modules*'` | Succès | Inventaire fichiers |
| `rg -n ... motifs sensibles ...` | Succès | Recherche statique large |
| `git log --all --oneline --max-count=20` | Succès | Historique récent inspecté |
| `rg -n --hidden ... secrets patterns ...` | Succès, exit 1 | Aucun motif secret réel trouvé par cette recherche |
| `npm audit` | Avertissement | Échec environnemental `403 Forbidden` sur le registre npm; non concluant |
| `npm audit --omit=dev` | Avertissement | Échec environnemental `403 Forbidden`; non concluant |
| `npm outdated` | Avertissement | Échec environnemental `403 Forbidden`; non concluant |
| `npm run build` | Succès avec avertissement | Build OK; avertissement Google Fonts non téléchargée, optimisation de police ignorée |
| `git diff --check` | Succès | Vérification whitespace OK |
| `npm run verify:dropmap` | Avertissement | La vérification DropMap interne passe puis le script refuse les fichiers docs/security car non-DropMap |

## Tests non réalisés volontairement

- Aucune requête contre production.
- Aucun upload vers service réel.
- Aucun envoi massif email.
- Aucun brute force login/reset.
- Aucune transaction paiement.
- Aucune modification Supabase/Vercel/Google.

## Incertitudes

- Les policies RLS réelles peuvent exister hors dépôt.
- Les buckets Supabase réels peuvent avoir des policies différentes.
- Vercel peut ajouter des protections preview/headers non visibles dans le dépôt.
- Supabase/Resend/Google peuvent appliquer des rate limits externes.
- Les variables de production ne sont pas accessibles; aucun secret réel n'a été vérifié.
- Les pages légales doivent être relues juridiquement pour conformité RGPD/consommation.

## Faux positifs possibles

- `SEC-006` dépend de l'état réel Supabase; le dépôt suggère une dérive possible, pas une faille production confirmée.
- `SEC-008` est réduit par SameSite=Lax, mais reste un durcissement recommandé pour actions sensibles.
- `SEC-016` ne confirme aucune CVE active car `npm audit` n'a pas pu interroger le registre; c'est un risque de maintenance à revérifier dans un environnement autorisé.
