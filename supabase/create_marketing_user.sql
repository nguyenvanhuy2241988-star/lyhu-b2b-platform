DO $$
DECLARE
  new_user_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
  -- 1. Create User in Auth System if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marketing@lyhu.app') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'marketing@lyhu.app',
      crypt('Marketing@123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Marketing Bot"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    -- If user exists, get the ID to ensure we update the correct profile
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'marketing@lyhu.app';
  END IF;

  -- 2. Create Profile linked to that User
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
      INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
      VALUES (
        new_user_id,
        'marketing@lyhu.app',
        'Marketing Bot',
        'marketing',
        'https://ui-avatars.com/api/?name=Marketing+Bot'
      );
  ELSE
      -- Update role if profile exists
      UPDATE public.profiles SET role = 'marketing' WHERE id = new_user_id;
  END IF;

END $$;
