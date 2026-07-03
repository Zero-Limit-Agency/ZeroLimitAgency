-- Phase 1 security hardening for SEC-002.
-- Non-destructive migration: keep legacy plaintext columns temporarily for compatibility
-- while adding encrypted/versioned token columns written by the server application.

alter table public.google_oauth_tokens
  add column if not exists access_token_encrypted text,
  add column if not exists refresh_token_encrypted text,
  add column if not exists token_encryption_version text,
  add column if not exists encrypted_at timestamptz;

alter table public.google_oauth_tokens
  alter column access_token drop not null;

create index if not exists google_oauth_tokens_encrypted_at_idx
  on public.google_oauth_tokens (encrypted_at);
