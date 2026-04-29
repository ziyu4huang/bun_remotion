export interface RouteContext {
  params: Record<string, string>;
  state: Map<string, unknown>;
}

export type RouteHandler = (
  req: Request,
  ctx: RouteContext,
) => Response | Promise<Response>;

export type Middleware = (
  req: Request,
  ctx: RouteContext,
  next: () => Promise<Response>,
) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

function compilePath(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexStr = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  return { pattern: new RegExp(`^${regexStr}$`), paramNames };
}

export class Router {
  private routes: Route[] = [];
  private middlewares: Middleware[] = [];

  use(mw: Middleware): this {
    this.middlewares.push(mw);
    return this;
  }

  get(path: string, handler: RouteHandler): this {
    return this.addRoute("GET", path, handler);
  }

  post(path: string, handler: RouteHandler): this {
    return this.addRoute("POST", path, handler);
  }

  private addRoute(method: string, path: string, handler: RouteHandler): this {
    const { pattern, paramNames } = compilePath(path);
    this.routes.push({ method, pattern, paramNames, handler });
    return this;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;

    let handler: RouteHandler;
    const params: Record<string, string> = {};

    const route = this.routes.find((r) => {
      if (r.method !== method) return false;
      const match = pathname.match(r.pattern);
      if (!match) return false;
      for (let i = 0; i < r.paramNames.length; i++) {
        params[r.paramNames[i]] = decodeURIComponent(match[i + 1]);
      }
      return true;
    });

    if (route) {
      handler = route.handler;
    } else {
      handler = () => Response.json({ error: "Not Found" }, { status: 404 });
    }

    const ctx: RouteContext = { params, state: new Map() };
    return this.runChain(req, ctx, handler);
  }

  private runChain(
    req: Request,
    ctx: RouteContext,
    handler: RouteHandler,
  ): Promise<Response> {
    let index = 0;
    const middlewares = this.middlewares;

    const dispatch = async (): Promise<Response> => {
      if (index < middlewares.length) {
        return middlewares[index++](req, ctx, dispatch);
      }
      return handler(req, ctx);
    };

    return dispatch();
  }
}
