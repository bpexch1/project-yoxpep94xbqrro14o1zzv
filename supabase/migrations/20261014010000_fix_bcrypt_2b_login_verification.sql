-- Fix valid bcrypt $2b$ user passwords being rejected by pgcrypto crypt().
-- pgcrypto's Blowfish crypt verifier only accepts the $2a$ salt prefix.
-- Translating the prefix for verification preserves cost, salt and digest.
-- Existing stored bcrypt hashes, login names, balances and sessions are not changed.
--
-- Verified using a synthetic bcrypt hash: correct password matches; incorrect password rejects.
CREATE OR REPLACE FUNCTION public.exchange_login(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  a public.clients%ROWTYPE;
  token text;
BEGIN
  SELECT * INTO a FROM public.clients
  WHERE lower(username) = lower(trim(p_username));

  IF a.id IS NULL OR a.status <> 'active'
     OR p_password IS NULL OR octet_length(p_password) > 72 THEN
    RAISE EXCEPTION 'Invalid username or password';
  END IF;

  IF char_length(a.password) <> 60
     OR left(a.password, 4) NOT IN ('$2a$', '$2b$', '$2y$') THEN
    RAISE EXCEPTION 'Invalid username or password';
  END IF;

  -- Compare the original digest after normalizing only the bcrypt version marker.
  IF substring(extensions.crypt(p_password, '$2a$' || substring(a.password FROM 5)) FROM 5)
     IS DISTINCT FROM substring(a.password FROM 5) THEN
    RAISE EXCEPTION 'Invalid username or password';
  END IF;

  token := encode(extensions.gen_random_bytes(32), 'hex');
  DELETE FROM public.exchange_sessions
  WHERE expires_at < now() OR client_id = a.id;
  INSERT INTO public.exchange_sessions
  VALUES (encode(extensions.digest(token, 'sha256'), 'hex'),
          a.id, now() + interval '8 hours', now());
  RETURN jsonb_build_object('token', token, 'expiresAt', now() + interval '8 hours',
                            'account', to_jsonb(a) - 'password' - 'auth_user_id');
END;
$function$;
