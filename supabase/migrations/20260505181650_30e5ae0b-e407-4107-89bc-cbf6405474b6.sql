
REVOKE EXECUTE ON FUNCTION public.is_chat_member(UUID, UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_or_create_direct_chat(UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, public, authenticated;
GRANT EXECUTE ON FUNCTION public.is_chat_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_chat(UUID) TO authenticated;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "chatfiles_public_read" ON storage.objects;
-- Files remain publicly accessible by URL via the public bucket; we just don't allow listing.
