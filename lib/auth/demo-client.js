import "server-only";

export const DEMO_CLIENT_EMAIL = "demo.client@z0agency.test";
export const DEMO_CLIENT_PASSWORD = "Z0AgencyDemo!2026";
export const DEMO_CLIENT_USER_ID = "demo-client";
export const DEMO_CLIENT_APPLICATION_ID = "demo";

export function isDemoClientCredentials(email, password) {
  return email === DEMO_CLIENT_EMAIL && password === DEMO_CLIENT_PASSWORD;
}

export function createDemoClientUser() {
  return {
    id: DEMO_CLIENT_USER_ID,
    email: DEMO_CLIENT_EMAIL,
    user_metadata: {
      full_name: "Client Demo"
    },
    app_metadata: {
      provider: "demo"
    }
  };
}

export function createDemoClientAccess() {
  return {
    user_id: DEMO_CLIENT_USER_ID,
    application_id: DEMO_CLIENT_APPLICATION_ID,
    email: DEMO_CLIENT_EMAIL,
    role: "client",
    status: "active"
  };
}

export function createDemoApplication() {
  return {
    id: DEMO_CLIENT_APPLICATION_ID,
    created_at: "2026-04-23T10:00:00.000Z",
    updated_at: "2026-04-23T10:00:00.000Z",
    first_name: "Client",
    last_name: "Demo",
    pseudo: "zla-demo",
    email: DEMO_CLIENT_EMAIL,
    birth_date: "2001-06-15",
    company: "Studio Horizon",
    country: "France",
    language: "Français",
    request_type: "Inscription avec devis",
    message_raw:
      "Je souhaite tester l'espace client, voir le suivi du dossier et comprendre comment seront présentées les ressources.",
    message_rewritten:
      "Dossier de démonstration créé pour visualiser le futur espace client, son statut, ses informations principales et la présentation des ressources partagées.",
    status: "approved",
    newsletter_opt_in: true,
    drive_folder_id: "demo-folder",
    drive_folder_url: "https://drive.google.com/drive/folders/demo-folder",
    notion_url: "https://www.notion.so/demo-zero-limit-agency"
  };
}

export function createDemoProfile() {
  return {
    user_id: null,
    application_id: DEMO_CLIENT_APPLICATION_ID,
    avatar_data_url: null,
    notion_url: "https://www.notion.so/demo-zero-limit-agency",
    space_status: "active",
    market_access_enabled: true,
    market_settings: {},
    resource_links: [],
    timeline_events: []
  };
}
