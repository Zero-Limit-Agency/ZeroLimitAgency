# 05 — API, validation, uploads et sécurité serveur

## Validation d'entrée

- Emails : validation regex simple et longueur max.
- Textes : `clampText` tronque plusieurs champs; certains champs admin sont seulement trimés.
- UUID : validation dans plusieurs routes via `isUuidLike`.
- Fichiers : extension, MIME et magic bytes pour PDF/PNG/JPEG/WEBP/HEIC/ZIP selon cas.

## Uploads

| Fonction | Stockage | Contrôles observés | Risques restants |
| --- | --- | --- | --- |
| Contact files | Google Drive | max 6, 10 MB/fichier, 24 MB total, types limités | ZIP autorisé sans antivirus; coûts Drive; fichiers confiés au Drive connecté |
| Avatar client | DB `avatar_data_url` | images seulement, 2 MB | Stockage base64 en DB, croissance table/profil |
| Collaboration | Supabase Storage | max 5, 10 MB/fichier, signatures | Bucket privé supposé; contrôle dépend du proxy API |
| Site assets admin | Supabase Storage public probable | Images contrôlées | Bucket public; s'assurer pas de SVG/HTML |
| Post-call documents | Supabase Storage | PDF/images selon routes | URLs proxy à tester |

## Injections serveur

- Pas d'usage de `eval`, `new Function`, `child_process` observé dans l'application.
- Requêtes Supabase REST construites avec `encodeURIComponent` pour les IDs/emails dans la lib admin.
- Google Drive query échappe les quotes/backslashes.
- Chemins Storage nettoyés via `sanitizeFileName` et segmentation encodée.

## CSRF/CORS/origines

- Pas de configuration CORS permissive observée.
- Pas de middleware CSRF explicite.
- SameSite=Lax réduit les POST cross-site classiques, mais ne remplace pas une vérification Origin/CSRF token pour actions sensibles admin/client.

## SSRF et ressources externes

- Les appels externes observés ciblent des endpoints fixes : Supabase, Google OAuth/Drive, Resend, OpenAI potentiel.
- Pas de fetch arbitraire sur URL utilisateur observé.
- Les URLs saisies par admin pour ressources client (`notion_url`, `drive_folder_url`, liens) sont stockées/rendues; validation protocole/domaine à durcir.

## Redirections

- Google OAuth `next` est limité à un chemin commençant par `/admin` au démarrage.
- Auth login redirige selon rôle avec chemins fixes.
- Rechercher et tester tout futur paramètre `next` avant extension OAuth/client.
