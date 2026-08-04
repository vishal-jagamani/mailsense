---
trigger: always_on
---

# TypeScript Coding Standards & Type Safety Rules

This document outlines the strict type safety rules and standards for the MailSense backend project.

## 1. Type Safety Requirements

- **No `any` Type**: Do not use the `any` type under any circumstances. Using `any` bypasses TypeScript's type checking and can lead to runtime errors.
- **No `never` Type**: Avoid the `never` type unless it is representing unreachable code execution blocks (e.g. in exhaustive type checks/switches). Do not use it as a placeholder or return type.
- **No `unknown` Type**: Do not use the `unknown` type in place of proper interface structures, type arguments, or generics.
- **Strict Generic Bindings**: Always write generic type parameters and cast using typed definitions/assertions (e.g., indexed type contracts `SystemEventPayloads[K]`) instead of generic object fallback types.

## 2. Recommended Patterns

- Define interface payloads for event contracts, queues, and API schemas.
- Leverage indexing (e.g. `Record<K, V>` or specific interface key mapping) to ensure compiler-enforced constraints.