const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export type AuthUser = {
  id: string;
  email?: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  user: AuthUser;
};

function config() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase não configurado.');
  }
  return { url: SUPABASE_URL, key: SUPABASE_KEY };
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.msg ||
        data?.message ||
        data?.error_description ||
        data?.error ||
        'Erro ao comunicar com o servidor.'
    );
  }

  return data;
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse(response);
}

export async function signUp(email: string, password: string): Promise<AuthSession | null> {
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseResponse(response);
  return data?.access_token ? data : null;
}

export async function refreshSession(refreshToken: string): Promise<AuthSession> {
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return parseResponse(response);
}

export async function signOutRemote(accessToken: string) {
  const { url, key } = config();
  await fetch(`${url}/auth/v1/logout`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
  });
}

function authHeaders(accessToken: string, prefer?: string) {
  const { key } = config();
  return {
    apikey: key,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

export async function getGestaoData(accessToken: string, userId: string) {
  const { url } = config();
  const response = await fetch(
    `${url}/rest/v1/gestao_user_data?user_id=eq.${encodeURIComponent(userId)}&select=obras,updated_at`,
    { headers: authHeaders(accessToken) }
  );
  const data = await parseResponse(response);
  return data?.[0] || null;
}

export async function saveGestaoData(accessToken: string, userId: string, obras: unknown[]) {
  const { url } = config();
  const response = await fetch(
    `${url}/rest/v1/gestao_user_data?on_conflict=user_id`,
    {
      method: 'POST',
      headers: authHeaders(accessToken, 'resolution=merge-duplicates,return=minimal'),
      body: JSON.stringify({
        user_id: userId,
        obras,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) {
    await parseResponse(response);
  }
}


export async function uploadGestaoPhoto(
  accessToken: string,
  userId: string,
  obraId: string,
  fileName: string,
  body: Blob,
  contentType: string
) {
  const { url, key } = config();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  const objectPath = `${userId}/${obraId}/${Date.now()}-${safeName}`;

  const response = await fetch(
    `${url}/storage/v1/object/gestao-fotos/${objectPath}`,
    {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType || 'image/jpeg',
        'x-upsert': 'false',
      },
      body,
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || 'Não foi possível enviar a foto.');
  }

  return objectPath;
}

export async function createGestaoPhotoSignedUrl(
  accessToken: string,
  objectPath: string,
  expiresIn = 3600
) {
  const { url, key } = config();
  const response = await fetch(
    `${url}/storage/v1/object/sign/gestao-fotos/${objectPath}`,
    {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn }),
    }
  );

  const data = await parseResponse(response);
  const signedPath = data?.signedURL || data?.signedUrl || data?.signed_url;

  if (!signedPath) {
    throw new Error('Não foi possível gerar o acesso à foto.');
  }

  return signedPath.startsWith('http') ? signedPath : `${url}/storage/v1${signedPath}`;
}
