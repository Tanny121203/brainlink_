export async function apiRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`/.netlify/functions/${path}`, {
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = (await res.json()) as { error?: string; detail?: string }
      if (data?.error && data?.detail) message = `${data.error}: ${data.detail}`
      else if (data?.error) message = data.error    
    } catch {
      // ignore parse failures
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}

