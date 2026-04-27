function corsOrigin() {
  return process.env.CORS_ORIGIN || 'http://localhost:8888'
}

export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  }
}

export function withCors(response) {
  return {
    ...response,
    headers: {
      ...response.headers,
      'access-control-allow-origin': corsOrigin(),
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    },
  }
}

export function handleOptions() {
  return withCors({ statusCode: 204, headers: {}, body: '' })
}

