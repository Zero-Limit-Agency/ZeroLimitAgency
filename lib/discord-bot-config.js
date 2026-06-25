export const DISCORD_BOT_CONFIG = {
  name: process.env.NEXT_PUBLIC_DISCORD_BOT_NAME || "Bot Discord Zero Limit Agency",
  description:
    "Assistant Discord conçu pour aider les administrateurs à préparer, organiser et déployer des structures de serveurs communautaires.",
  supportEmail: "contact@zerolimit.agency",
  privacyEmail: "clients@zerolimit.agency",
  inviteUrl: process.env.NEXT_PUBLIC_DISCORD_BOT_INVITE_URL || "",
  applicationId: process.env.NEXT_PUBLIC_DISCORD_APPLICATION_ID || "",
  officialSiteUrl: "https://zerolimit.agency",
  discordPageUrl: "https://zerolimit.agency/discord",
  termsUrl: "https://zerolimit.agency/discord/terms",
  privacyUrl: "https://zerolimit.agency/discord/privacy",
  supportUrl: "https://zerolimit.agency/discord/support",
  legalEffectiveDate: "25 juin 2026",
  legalLastUpdated: "25 juin 2026"
};
