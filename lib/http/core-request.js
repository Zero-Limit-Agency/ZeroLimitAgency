// Core mutations must acknowledge success explicitly before the UI navigates,
// resets a form, or announces a saved change. Never retry mutations implicitly.
export async function requestCoreJson(url, options) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true) {
    const error = new Error("Core request failed");
    error.result = result;
    throw error;
  }
  return result;
}
