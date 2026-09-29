export async function bindImportedSession(
  accessToken,
  refreshToken,
  { getUserFromAccessToken, refreshSession }
) {
  if (!accessToken || !refreshToken) return null;

  const accessUserResult = await getUserFromAccessToken(accessToken);
  if (!accessUserResult.ok || !accessUserResult.data?.id) return null;

  const refreshedSession = await refreshSession(refreshToken);
  if (!refreshedSession.ok || !refreshedSession.data?.access_token || !refreshedSession.data?.refresh_token) {
    return null;
  }

  const refreshedUserResult = await getUserFromAccessToken(refreshedSession.data.access_token);
  if (!refreshedUserResult.ok || refreshedUserResult.data?.id !== accessUserResult.data.id) return null;

  return refreshedSession.data;
}
