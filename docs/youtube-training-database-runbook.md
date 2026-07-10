# Mise en service base de données — Formation YouTube

Ce runbook documente la mise en service contrôlée du socle base de données de la Formation YouTube.

## État de ce commit

- La migration structurelle existe : `supabase/migrations/20260704_training_platform_foundation.sql`.
- Aucun accès Supabase réel n'était disponible dans l'environnement d'agent au moment de ce commit : pas de `supabase/config.toml`, pas de CLI Supabase détectée, et aucune variable Supabase réelle exposée.
- La migration n'a donc pas été appliquée depuis cet environnement.
- La production n'a pas été modifiée.

## Pré-requis avant application

1. Identifier explicitement l'environnement cible : preview, staging ou production.
2. Vérifier le project ref Supabase via la CLI, le dashboard ou la configuration d'infrastructure.
3. Vérifier qu'une sauvegarde ou un point de restauration existe avant toute application en production.
4. Confirmer que `public.is_admin_user()` existe déjà. Elle est créée par `supabase/migrations/20260703_security_policies_and_entitlements.sql`.
5. Vérifier qu'aucun objet `training_*`, `has_training_access` ou `has_training_lesson_access` incompatible n'existe déjà.

## Application recommandée

Utiliser le mécanisme officiel du projet et de Supabase pour appliquer la migration complète, sans copier partiellement le SQL et sans désactiver RLS.

À vérifier après application :

- tables : `training_programs`, `training_packs`, `training_modules`, `training_lessons`, `training_entitlements`, `training_lesson_progress`, `training_favorites`, `training_notes`, `training_resources`, `training_comments` ;
- fonctions : `has_training_access`, `has_training_lesson_access` ;
- RLS activées sur toutes les tables ;
- policies présentes ;
- indexes et contraintes créés.

## Initialisation contrôlée du catalogue

Le script ponctuel `scripts/initialize-youtube-training-catalog.mjs` initialise uniquement :

- programme `Formation YouTube`, product key `training.youtube`, statut `draft` ;
- packs `Montage`, `Graphisme`, `Monétisation`, `Se lancer / Les bases`, tous en `draft`.

Il ne crée pas : modules, leçons, vidéos, formateurs, ressources, prix, achats, progressions, notes, favoris, commentaires ou entitlements.

Exécution depuis un environnement autorisé contenant les variables nécessaires :

```bash
node scripts/initialize-youtube-training-catalog.mjs
```

Variables requises :

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Le script ne loggue pas les secrets et s'arrête sans écriture si les variables sont absentes ou si les tables formation ne sont pas disponibles.

## Packs initialisés

| Ordre | Titre | Slug | Product key | Statut |
| --- | --- | --- | --- | --- |
| 1 | Montage | `montage` | `training.youtube.editing` | `draft` |
| 2 | Graphisme | `graphisme` | `training.youtube.design` | `draft` |
| 3 | Monétisation | `monetisation` | `training.youtube.monetization` | `draft` |
| 4 | Se lancer / Les bases | `se-lancer-les-bases` | `training.youtube.basics` | `draft` |

## Attribution manuelle

Après migration, utiliser `/admin/formations` pour :

1. rechercher un utilisateur Supabase Auth ;
2. choisir un accès programme ou pack ;
3. définir statut, début, expiration éventuelle et note interne ;
4. désactiver ou réactiver l'accès si nécessaire.

Ne pas créer de rôle premium. Le premium futur devra rester un entitlement séparé si nécessaire.

## Rollback réaliste

En production, le rollback réaliste doit passer par la restauration Supabase ou un plan de migration corrective validé.

Ne pas lancer `supabase db reset` sur une base distante.
Ne pas supprimer en cascade les tables formation si des entitlements, progressions, notes ou favoris existent déjà.

## Limites actuelles

- Pas de modules/leçons réels initialisés.
- Packs en `draft`, donc invisibles côté client normal.
- Les tests RLS réels nécessitent des JWT utilisateurs distincts ou une session Supabase de test autorisée.
