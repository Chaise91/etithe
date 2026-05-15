type RouteHandler = (request: Request) => Promise<Response> | Response;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
}

export function withRequestLogging(routeName: string, handler: RouteHandler): RouteHandler {
  return async function loggedRoute(request: Request) {
    const startedAt = Date.now();
    const requestUrl = new URL(request.url);

    try {
      const response = await handler(request);
      const durationMs = Date.now() - startedAt;

      console.info(
        JSON.stringify({
          level: response.status >= 500 ? "error" : "info",
          route: routeName,
          method: request.method,
          path: requestUrl.pathname,
          status: response.status,
          durationMs,
        })
      );

      return response;
    } catch (error) {
      const durationMs = Date.now() - startedAt;

      console.error(
        JSON.stringify({
          level: "error",
          route: routeName,
          method: request.method,
          path: requestUrl.pathname,
          durationMs,
          error: serializeError(error),
        })
      );

      throw error;
    }
  };
}