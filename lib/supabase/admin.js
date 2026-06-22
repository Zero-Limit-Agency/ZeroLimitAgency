import "server-only";

import { supabaseServerRequest } from "@/lib/supabase/server";
import { MAINTENANCE_MODE_KEY } from "@/lib/maintenance";
import { YOUTUBE_TRAINING_SETTINGS_KEY } from "@/lib/learn-youtube/settings-shared";
import { SITE_CONTENT_KEY } from "@/lib/site-content";

export function createSupabaseAdminClient() {
  return {
    applications: {
      list() {
        return supabaseServerRequest(
          "/rest/v1/applications?select=*&order=created_at.desc",
          {
            useServiceRole: true
          }
        );
      },
      create(record) {
        return supabaseServerRequest("/rest/v1/applications", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "return=representation"
          },
          body: record
        });
      },
      update(applicationId, record) {
        return supabaseServerRequest(
          `/rest/v1/applications?id=eq.${encodeURIComponent(applicationId)}`,
          {
            method: "PATCH",
            useServiceRole: true,
            headers: {
              Prefer: "return=representation"
            },
            body: record
          }
        );
      },
      getById(applicationId) {
        return supabaseServerRequest(
          `/rest/v1/applications?id=eq.${encodeURIComponent(applicationId)}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      getLatestByEmail(email) {
        return supabaseServerRequest(
          `/rest/v1/applications?email=eq.${encodeURIComponent(email)}&select=*&order=created_at.desc&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      getLatestApprovedByEmail(email) {
        return supabaseServerRequest(
          `/rest/v1/applications?email=eq.${encodeURIComponent(
            email
          )}&status=eq.approved&select=*&order=created_at.desc&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      delete(applicationId) {
        return supabaseServerRequest(
          `/rest/v1/applications?id=eq.${encodeURIComponent(applicationId)}`,
          {
            method: "DELETE",
            useServiceRole: true,
            headers: {
              Prefer: "return=representation"
            }
          }
        );
      }
    },
    newsletterSubscriptions: {
      upsert(record) {
        return supabaseServerRequest("/rest/v1/newsletter_subscriptions?on_conflict=email", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: record
        });
      },
      detachFromApplication(applicationId) {
        return supabaseServerRequest(
          `/rest/v1/newsletter_subscriptions?application_id=eq.${encodeURIComponent(applicationId)}`,
          {
            method: "PATCH",
            useServiceRole: true,
            headers: {
              Prefer: "return=representation"
            },
            body: {
              application_id: null
            }
          }
        );
      }
    },
    googleOAuthTokens: {
      get(provider = "google_drive") {
        return supabaseServerRequest(
          `/rest/v1/google_oauth_tokens?provider=eq.${encodeURIComponent(provider)}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      upsert(record) {
        return supabaseServerRequest("/rest/v1/google_oauth_tokens?on_conflict=provider", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: record
        });
      }
    },
    clientAccess: {
      getByUserId(userId) {
        return supabaseServerRequest(
          `/rest/v1/client_access?user_id=eq.${encodeURIComponent(userId)}&status=eq.active&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      getAnyByUserId(userId) {
        return supabaseServerRequest(
          `/rest/v1/client_access?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      getByApplicationId(applicationId) {
        return supabaseServerRequest(
          `/rest/v1/client_access?application_id=eq.${encodeURIComponent(applicationId)}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      upsert(record) {
        return supabaseServerRequest("/rest/v1/client_access?on_conflict=user_id", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: record
        });
      },
      upsertByApplication(record) {
        return supabaseServerRequest("/rest/v1/client_access?on_conflict=application_id", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: record
        });
      }
    },
    clientProfiles: {
      getByUserId(userId) {
        return supabaseServerRequest(
          `/rest/v1/client_profiles?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      getByApplicationId(applicationId) {
        return supabaseServerRequest(
          `/rest/v1/client_profiles?application_id=eq.${encodeURIComponent(applicationId)}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      updateByApplication(applicationId, record) {
        return supabaseServerRequest(
          `/rest/v1/client_profiles?application_id=eq.${encodeURIComponent(applicationId)}`,
          {
            method: "PATCH",
            useServiceRole: true,
            headers: {
              Prefer: "return=representation"
            },
            body: record
          }
        );
      },
      upsertByApplication(record) {
        return supabaseServerRequest("/rest/v1/client_profiles?on_conflict=application_id", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: record
        });
      }
    },
    globalMarketSettings: {
      get() {
        return supabaseServerRequest(
          `/rest/v1/global_market_settings?key=eq.${encodeURIComponent("fortnite_global_market")}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      upsert(record) {
        return supabaseServerRequest("/rest/v1/global_market_settings?on_conflict=key", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: {
            key: "fortnite_global_market",
            ...record
          }
        });
      }
    },
    globalSiteSettings: {
      get() {
        return supabaseServerRequest(
          `/rest/v1/global_site_settings?key=eq.${encodeURIComponent(SITE_CONTENT_KEY)}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      upsert(record) {
        return supabaseServerRequest("/rest/v1/global_site_settings?on_conflict=key", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: {
            key: SITE_CONTENT_KEY,
            ...record
          }
        });
      }
    },
    globalMaintenanceSettings: {
      get() {
        return supabaseServerRequest(
          `/rest/v1/global_site_settings?key=eq.${encodeURIComponent(MAINTENANCE_MODE_KEY)}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      upsert(record) {
        return supabaseServerRequest("/rest/v1/global_site_settings?on_conflict=key", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: {
            key: MAINTENANCE_MODE_KEY,
            ...record
          }
        });
      }
    },
    youtubeTrainingSettings: {
      get() {
        return supabaseServerRequest(
          `/rest/v1/global_site_settings?key=eq.${encodeURIComponent(YOUTUBE_TRAINING_SETTINGS_KEY)}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      upsert(record) {
        return supabaseServerRequest("/rest/v1/global_site_settings?on_conflict=key", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: {
            key: YOUTUBE_TRAINING_SETTINGS_KEY,
            ...record
          }
        });
      }
    },
    postCallZeroPackets: {
      getByApplicationId(applicationId) {
        return supabaseServerRequest(
          `/rest/v1/post_call_zero_packets?application_id=eq.${encodeURIComponent(applicationId)}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      upsertByApplication(record) {
        return supabaseServerRequest("/rest/v1/post_call_zero_packets?on_conflict=application_id", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: record
        });
      },
      updateByApplication(applicationId, record) {
        return supabaseServerRequest(
          `/rest/v1/post_call_zero_packets?application_id=eq.${encodeURIComponent(applicationId)}`,
          {
            method: "PATCH",
            useServiceRole: true,
            headers: {
              Prefer: "return=representation"
            },
            body: record
          }
        );
      },
      deleteByApplication(applicationId) {
        return supabaseServerRequest(
          `/rest/v1/post_call_zero_packets?application_id=eq.${encodeURIComponent(applicationId)}`,
          {
            method: "DELETE",
            useServiceRole: true,
            headers: {
              Prefer: "return=representation"
            }
          }
        );
      }
    },
    clientCallReports: {
      getByApplicationId(applicationId) {
        return supabaseServerRequest(
          `/rest/v1/client_call_reports?application_id=eq.${encodeURIComponent(applicationId)}&select=*&order=created_at.desc&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      upsertByApplication(record) {
        return supabaseServerRequest("/rest/v1/client_call_reports?on_conflict=application_id", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: record
        });
      },
      updateByApplication(applicationId, record) {
        return supabaseServerRequest(
          `/rest/v1/client_call_reports?application_id=eq.${encodeURIComponent(applicationId)}`,
          {
            method: "PATCH",
            useServiceRole: true,
            headers: {
              Prefer: "return=representation"
            },
            body: record
          }
        );
      }
    },
    clientCollaborationMessages: {
      listByApplicationId(applicationId) {
        return supabaseServerRequest(
          `/rest/v1/client_collaboration_messages?application_id=eq.${encodeURIComponent(applicationId)}&select=*&order=created_at.asc`,
          {
            useServiceRole: true
          }
        );
      },
      getById(messageId) {
        return supabaseServerRequest(
          `/rest/v1/client_collaboration_messages?id=eq.${encodeURIComponent(messageId)}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      create(record) {
        return supabaseServerRequest("/rest/v1/client_collaboration_messages", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "return=representation"
          },
          body: record
        });
      },
      deleteByApplication(applicationId) {
        return supabaseServerRequest(
          `/rest/v1/client_collaboration_messages?application_id=eq.${encodeURIComponent(applicationId)}`,
          {
            method: "DELETE",
            useServiceRole: true,
            headers: {
              Prefer: "return=representation"
            }
          }
        );
      }
    },
    userRoles: {
      getByUserId(userId) {
        return supabaseServerRequest(
          `/rest/v1/user_roles?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
          {
            useServiceRole: true
          }
        );
      },
      upsert(record) {
        return supabaseServerRequest("/rest/v1/user_roles?on_conflict=user_id", {
          method: "POST",
          useServiceRole: true,
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: record
        });
      }
    },
    auth: {
      listUsers({ page = 1, perPage = 1 } = {}) {
        return supabaseServerRequest(
          `/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
          {
            useServiceRole: true
          }
        );
      },
      createUser(attributes) {
        return supabaseServerRequest("/auth/v1/admin/users", {
          method: "POST",
          useServiceRole: true,
          body: attributes
        });
      },
      updateUser(userId, attributes) {
        return supabaseServerRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
          method: "PUT",
          useServiceRole: true,
          body: attributes
        });
      },
      deleteUser(userId) {
        return supabaseServerRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
          method: "DELETE",
          useServiceRole: true
        });
      },
      async findUserByEmail(email) {
        const normalizedEmail = String(email || "").trim().toLowerCase();

        if (!normalizedEmail) {
          return {
            ok: false,
            status: 400,
            data: null,
            error: "Email introuvable."
          };
        }

        let page = 1;
        const perPage = 200;

        while (page < 20) {
          const response = await this.listUsers({ page, perPage });

          if (!response.ok) {
            return {
              ...response,
              error: "Impossible de récupérer les utilisateurs Supabase Auth."
            };
          }

          const users = Array.isArray(response.data?.users) ? response.data.users : [];
          const match = users.find(
            (user) => String(user?.email || "").trim().toLowerCase() === normalizedEmail
          );

          if (match) {
            return {
              ok: true,
              status: 200,
              data: match
            };
          }

          if (users.length < perPage) {
            break;
          }

          page += 1;
        }

        return {
          ok: true,
          status: 404,
          data: null
        };
      },
      sendPasswordRecovery(email, redirectTo) {
        return supabaseServerRequest("/auth/v1/recover", {
          method: "POST",
          body: {
            email,
            redirect_to: redirectTo,
            gotrue_meta_security: {},
            code_challenge: null,
            code_challenge_method: null
          },
          headers: redirectTo ? { redirectTo, redirect_to: redirectTo } : undefined
        });
      },
      updateUserPassword(accessToken, password) {
        return supabaseServerRequest("/auth/v1/user", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          body: {
            password
          }
        });
      }
    },
    rest: {
      openApi() {
        return supabaseServerRequest("/rest/v1/", {
          headers: {
            Accept: "application/openapi+json"
          }
        });
      }
    },
    authPublic: {
      settings() {
        return supabaseServerRequest("/auth/v1/settings");
      }
    }
  };
}
