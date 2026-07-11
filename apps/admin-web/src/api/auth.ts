export interface LoginUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  storeIds: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: LoginUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch('/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      Array.isArray(data.message) ? data.message.join(', ') : data.message || '登录失败，请检查账号密码';
    throw new Error(message);
  }

  return data as LoginResponse;
}

export function saveSession(token: string, user: LoginUser) {
  localStorage.setItem('accessToken', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
}

export function getSession(): { token: string; user: LoginUser } | null {
  const token = localStorage.getItem('accessToken');
  const raw = localStorage.getItem('user');
  if (!token || !raw) return null;
  try {
    return { token, user: JSON.parse(raw) as LoginUser };
  } catch {
    return null;
  }
}
