# Environment Variables in Astro on Cloudflare Workers

This project uses Astro with the `@astrojs/cloudflare` adapter. Accessing environment variables depends on the context:

| Context                  | How to Access Environment Variables                              |
| ------------------------ | ---------------------------------------------------------------- |
| Astro component          | `Astro.locals.runtime.env.YOUR_VAR`                              |
| API route/endpoint       | `locals.runtime.env.YOUR_VAR`                                    |
| Build-time (not runtime) | `import.meta.env.YOUR_VAR` (not for Cloudflare runtime bindings) |

## Key Points

- **Cloudflare runtime bindings** (from `wrangler.toml` or `.dev.vars`) are only available at runtime via `locals.runtime.env` (API routes/middleware) or `Astro.locals.runtime.env` (Astro components).
- **`import.meta.env`** is only for build-time variables or `.env` files, **not** for Cloudflare runtime bindings.
- There is **no global `runtime.env`**—it must be accessed via the provided context/locals objects.

## Examples

### API Route Example

```ts
export const GET: APIRoute = async ({ locals }) => {
  const mySecret = locals.runtime.env.MY_SECRET;
  return new Response(`Secret: ${mySecret}`);
};
```

### Astro Component Example

```astro
---
const basePath = Astro.locals.runtime.env.BASE_URL;
---
<a href={`${basePath}/docs`}>Docs</a>
```

### Build-Time Example

```ts
const buildTimeVar = import.meta.env.BUILD_ONLY_VAR;
```

## Local Development

- Use `.dev.vars` and run `wrangler dev` to simulate the Cloudflare environment locally.
- Do **not** use `import.meta.env` for runtime Cloudflare bindings in production code.

## References

- [Astro Cloudflare Adapter Docs](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Workers Environment Bindings](https://developers.cloudflare.com/workers/platform/environment-variables/)
