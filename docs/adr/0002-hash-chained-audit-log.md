# ADR 0002: Store audit events in a hash chain

- Status: accepted
- Date: 2025-01-28

## Context

Clinical staff and auditors need to answer who viewed or changed a record and when. The
initial audit table recorded those facts, but an ordinary row is easy to edit or delete
without leaving a trace. The pilot raised a reasonable question: how would we notice that the
activity history had been altered?

A full event-sourcing system or an external append-only service would be more robust, but it
adds operational work the team cannot support yet.

## Decision

Each audit event stores the hash of the previous event and a hash of its own canonical
content. Content includes actor, action, resource, outcome, request metadata, timestamp, and
the previous hash. Keys are sorted before hashing so the digest is stable.

Events are written in the same database transaction as the change they describe. The admin
audit page walks a window in chronological order and reports the first break. A null
previous hash marks the start of the retained window.

## Consequences

- Accidental edits and deletions inside the window are detectable.
- The chain is tamper-evident, not tamper-proof. A privileged operator can rebuild the whole
  chain, so database access must be restricted and events should be exported to append-only
  storage.
- Concurrent writers serialize on the latest-hash lookup. At the current write volume this is
  acceptable; a high-throughput system would need a dedicated sequencer or a database
  constraint that makes each append unique.
- Verification cost grows with the window. The UI checks the most recent 500 events; a
  scheduled job should verify older windows.
- Any change to the canonical field set is a breaking format change. Keep the serializer
  versioned if the event shape evolves.
