import "server-only";

export {
  DEFAULT_YOUTUBE_TRAINING_SETTINGS,
  YOUTUBE_TRAINING_MAINTENANCE_MESSAGE_MAX_LENGTH,
  YOUTUBE_TRAINING_MODES,
  YOUTUBE_TRAINING_SETTINGS_KEY,
  normalizeYoutubeTrainingSettings,
  validateYoutubeTrainingSettingsPayload
} from "@/lib/learn-youtube/settings-shared";

import {
  DEFAULT_YOUTUBE_TRAINING_SETTINGS,
  normalizeYoutubeTrainingSettings
} from "@/lib/learn-youtube/settings-shared";

export async function getYoutubeTrainingSettings(adminClient) {
  try {
    const result = await adminClient.youtubeTrainingSettings.get();

    if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
      return DEFAULT_YOUTUBE_TRAINING_SETTINGS;
    }

    return normalizeYoutubeTrainingSettings(result.data[0]?.settings || {});
  } catch {
    return DEFAULT_YOUTUBE_TRAINING_SETTINGS;
  }
}
