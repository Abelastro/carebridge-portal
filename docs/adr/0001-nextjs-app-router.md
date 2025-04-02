# ADR 0001: Use the Next.js App Router with server actions

- Status: accepted
- Date: 2024-11-12

## Context

The first prototype used a client-rendered React application and a small JSON API. Two
problems appeared during the pilot:

- Every screen repeated authorization and data-loading logic in the browser.
- Clinical notes and session data were crossing the network more often than necessary.

The team is small and already familiar with React. We need one deployable unit, server-side
rendering for slow clinical networks, and a clear place to enforce authorization.

## Decision

Adopt the Next.js App Router for pages and layouts, with React Server Components as the
default. Use server actions for form mutations and route handlers only where a JSON
response or a non-form client interaction is required.

Pages resolve the session and permission on the server. Server actions repeat those checks;
they are treated like public endpoints. Data access lives in `src/lib/services` rather than
inside components.

## Consequences

- The deployment is one Node process and one container image.
- Sensitive data can be fetched and rendered on the server without exposing a broad API.
- Authorization is centralized and easy to review.
- Server actions require careful origin and input handling because they are reachable from
  the network.
- The team must understand the server/client boundary; importing a server-only module into a
  client component is a build error, which is a useful guardrail.
- A future mobile client would need explicit route handlers because server actions are not a
  general-purpose API.
