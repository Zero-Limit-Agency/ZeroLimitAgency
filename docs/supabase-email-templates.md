# Templates email Supabase - Zero Limit Agency

Ces modèles sont prévus pour l'interface **Supabase > Authentication > Email Templates**.

Ils ne sont pas appliqués automatiquement par le code : il faut les coller dans le dashboard Supabase pour remplacer les emails génériques.

## Recommandations

- `Site URL` : votre domaine principal
- `Redirect URLs` :
  - `http://localhost:3000/connexion/definir-mot-de-passe`
  - votre future URL Vercel de production sur le même chemin
- dans les templates, privilégiez `{{ .RedirectTo }}` plutôt que `{{ .SiteURL }}` si vous utilisez des liens personnalisés de redirection

Référence officielle Supabase :
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Password-based Auth](https://supabase.com/docs/guides/auth/passwords)

## Sujet - Invitation / activation

```text
Activez votre accès client - Zero Limit Agency
```

## HTML - Invitation / activation

```html
<div style="margin:0;padding:32px 16px;background:#180d10;font-family:Georgia,serif;color:#fdf3f0;">
  <div style="max-width:620px;margin:0 auto;background:linear-gradient(180deg,#3b1d24 0%,#241116 100%);border:1px solid rgba(255,240,236,0.08);border-radius:28px;padding:40px 32px;box-shadow:0 30px 80px rgba(0,0,0,0.35);">
    <p style="margin:0 0 12px 0;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#d8a46f;">Zero Limit Agency</p>
    <h1 style="margin:0 0 18px 0;font-size:36px;line-height:1.05;color:#fff7f5;">Votre espace client est prêt</h1>
    <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:rgba(255,245,243,0.86);">
      Bonjour,
    </p>
    <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:rgba(255,245,243,0.86);">
      Votre dossier client a été activé. Vous pouvez maintenant définir votre mot de passe et accéder à votre espace personnel pour suivre votre accompagnement, consulter vos ressources et retrouver les informations essentielles de votre projet.
    </p>
    <div style="margin:28px 0;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:15px 24px;border-radius:999px;background:#f0c994;color:#1c0d0e;text-decoration:none;font-weight:700;">
        Définir mon mot de passe
      </a>
    </div>
    <p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,245,243,0.7);">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
    </p>
    <p style="margin:0 0 20px 0;font-size:14px;line-height:1.7;word-break:break-all;color:#f6d7c9;">
      {{ .ConfirmationURL }}
    </p>
    <p style="margin:0;font-size:14px;line-height:1.7;color:rgba(255,245,243,0.62);">
      Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
    </p>
  </div>
</div>
```

## Sujet - Réinitialisation de mot de passe

```text
Réinitialisez votre accès - Zero Limit Agency
```

## HTML - Réinitialisation de mot de passe

```html
<div style="margin:0;padding:32px 16px;background:#180d10;font-family:Georgia,serif;color:#fdf3f0;">
  <div style="max-width:620px;margin:0 auto;background:linear-gradient(180deg,#3b1d24 0%,#241116 100%);border:1px solid rgba(255,240,236,0.08);border-radius:28px;padding:40px 32px;box-shadow:0 30px 80px rgba(0,0,0,0.35);">
    <p style="margin:0 0 12px 0;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#d8a46f;">Zero Limit Agency</p>
    <h1 style="margin:0 0 18px 0;font-size:36px;line-height:1.05;color:#fff7f5;">Réinitialisez votre accès</h1>
    <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:rgba(255,245,243,0.86);">
      Une demande de réinitialisation d'accès a été effectuée pour votre espace client.
    </p>
    <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:rgba(255,245,243,0.86);">
      Cliquez ci-dessous pour définir un nouveau mot de passe et retrouver votre dossier.
    </p>
    <div style="margin:28px 0;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:15px 24px;border-radius:999px;background:#f0c994;color:#1c0d0e;text-decoration:none;font-weight:700;">
        Réinitialiser mon mot de passe
      </a>
    </div>
    <p style="margin:0;font-size:14px;line-height:1.7;color:rgba(255,245,243,0.62);">
      Si cette demande ne vient pas de vous, vous pouvez ignorer cet email.
    </p>
  </div>
</div>
```
