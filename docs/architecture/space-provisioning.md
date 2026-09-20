# Provisioning des espaces

La migration `20260920_space_provisioning_entitlements.sql` dépend explicitement de `20260703_security_policies_and_entitlements.sql`, qui crée la table d'audit legacy `public.audit_logs`. Elle vérifie avant toute création d'objet que cette table existe et que les six colonnes qu'elle écrit ont les types historiques attendus. Une base dont l'historique est incomplet doit appliquer la migration de sécurité de juillet avant les migrations Zero Limit; le provisioning ne crée pas de table d'audit parallèle et ne contourne jamais l'audit.

Les RPC `provision_personal_space`, `provision_creator_space` et `provision_team` sont la couche transactionnelle réutilisable backend-only. `authenticated` et `anon` n'ont aucun droit EXECUTE; seul `service_role` peut les appeler. La route Next.js vérifie d'abord la session, puis transmet côté serveur l'`auth.users.id` vérifié afin que la RPC dérive le profil correspondant. La clé service-role reste exclusivement serveur. Les RPC ont un `search_path = pg_catalog, public`, tous les objets applicatifs sont qualifiés et `CREATE` sur le schéma `public` est révoqué à `PUBLIC`.

La route interactive gratuite est active en développement/Preview. Elle est fermée si `VERCEL_ENV=production`, ou si `VERCEL_ENV` est absent avec `NODE_ENV=production`, sauf opt-in exact `ZERO_LIMIT_INTERACTIVE_PROVISIONING=enabled`. Un appel Supabase direct ne contourne pas cette frontière puisque `authenticated` ne peut pas exécuter les RPC de provisioning. À terme, un webhook billing signé pourra appeler la même couche backend avec une source `subscription`, sans dépendre de l'UI.

Personal est unique par `(owner_profile_id, personal_profession)`; Creator par propriétaire; Team par organisation. Les `ON CONFLICT` rendent les retries identiques idempotents et les index partiels arbitrent les courses. Les événements `*_created` et `entitlement_granted` ne sont écrits que si l'`INSERT ... RETURNING` correspondant a réellement créé une ligne. La création Team insère dans une même transaction l'organisation, puis le trigger existant crée son membership admin propriétaire, puis la RPC crée le Space et l'entitlement. `organizations.owner_profile_id` reste l'unique propriété canonique; `admin` n'implique jamais owner.

L'API fixe le dernier Space dans un cookie seulement après succès. Le switcher recharge ses données serveur; `requireSpaceAccess` revalide toujours l'accès. Les erreurs attendues deviennent des messages produit; les erreurs inconnues obtiennent un correlation ID sans SQL, réponse PostgREST ou stack côté client.

Une organisation n'a qu'un Team Space principal aujourd'hui. Une évolution multi-Space exigera une migration supprimant/remplaçant consciemment cet index. Suppression, transfert de propriété, rétention, révocation et billing restent hors périmètre.

Preview validation checkpoint — provisioning recette
