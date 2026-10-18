# Transactions API contract

## Endpoint

- Method and path: `GET /api/transactions`
- Success: `200 OK`
- Media type: `application/json`
- The response body is always a JSON array. No matching transactions returns `200 OK` with `[]`.
- This is a read-only controller; it declares only `GET`.

## TransactionResponse

| Field | JSON type | Contract |
| --- | --- | --- |
| `id` | string | Canonical UUID (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) |
| `categoryId` | string | Category identifier used by the current client for category filtering and summaries |
| `amount` | number | Decimal monetary amount |
| `currency` | string | ISO 4217 currency code; currently `HUF` |
| `startedAt` | string | ISO 8601 timestamp in UTC, serialized with a `Z` offset |
| `description` | string | Human-readable transaction description |

Example `startedAt`: `2026-10-18T10:30:00.0000000Z`.

## Example: two transactions

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "categoryId": "food",
    "amount": 2499.00,
    "currency": "HUF",
    "startedAt": "2026-10-18T10:30:00.0000000Z",
    "description": "Bevásárlás"
  },
  {
    "id": "2f1a2c9d-88d6-4f18-a2d0-9e5e1a7b3c40",
    "categoryId": "housing",
    "amount": 185000.00,
    "currency": "HUF",
    "startedAt": "2026-10-17T08:15:00.0000000Z",
    "description": "Havi albérlet"
  }
]
```

Empty response:

```json
[]
```

## Excluded data

The response DTO does not expose audit fields, internal status fields, EF Core entity or navigation properties, or `invitedMemberIds` (not applicable to transactions). `categoryId` is an explicit client-facing identifier, not an entity or persistence object.

## Contract rationale

- The EF Core entity is not the response schema: it contains persistence concerns and internal fields that must not be exported. Keeping a DTO separate also prevents database changes from silently changing the public contract and limits accidental data exposure.
- An empty result is still a successful list query: the endpoint exists and the collection has no elements. `404` would incorrectly imply that the endpoint/resource was not found.
- ISO 8601 UTC timestamps give clients a predictable parseable format and avoid local-time/time-zone ambiguity.
- `invitedMemberIds` is not relevant to listing transactions and is intentionally absent.
- `categoryId` is included as a backward-compatible client integration field so the existing category filtering and spending summaries continue working. Adding optional response fields such as `status`, `category`, or `tags` is also an additive, backward-compatible extension. Existing fields must not be renamed, removed, or have their meaning changed.

## Current persistence mapping

The existing persistence model stores `Title` and a date-only `Date`, and the prototype uses HUF. The API maps `Title` to `description`, maps `Date` to midnight UTC for `startedAt`, and supplies `HUF` as the current currency. If transactions later need an exact time or multiple currencies, persist those values explicitly and add an appropriate database migration without changing the established response field names or formats.