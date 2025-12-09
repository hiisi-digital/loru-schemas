# loru-schemas

**Shared data models, database schemas, and migration utilities for the Loru platform.**

This repository serves as the single source of truth for data structures used across the Loru ecosystem. It generates type-safe bindings for both TypeScript (Deno) and Rust (Axum/SQLx), ensuring consistency between the frontend, backend, and database layers.

## Features

- **Single Source of Truth** - Define data models once, use everywhere
- **Code Generation** - Automatic generation of TypeScript interfaces and Rust structs
- **Database Migrations** - SQLx migrations for PostgreSQL
- **Type Safety** - Guaranteed consistency between API and database

## Usage

### In Deno (TypeScript)

Import the generated models directly from the repository or package:

```typescript
// deno.json
{
  "imports": {
    "@loru/schemas": "github:hiisi-digital/loru-schemas@v0.3.2/deno/mod.ts"
  }
}
```

```typescript
import { Site, User } from "@loru/schemas";

const site: Site = {
  id: "site-123",
  // ...
};
```

### In Rust (Cargo)

Add as a git dependency in `Cargo.toml`:

```toml
[dependencies]
loru-schemas = { git = "https://github.com/hiisi-digital/loru-schemas", branch = "main" }
```

```rust
use loru_schemas::models::{Site, User};
```

## Project Structure

```
loru-schemas/
├── definitions/        # Source schema definitions (JSON Schema / IDL)
├── migrations/         # PostgreSQL migrations (SQLx)
├── src/                # Rust source code
│   ├── lib.rs
│   └── models/         # Generated Rust structs
├── deno/               # TypeScript source code
│   ├── mod.ts
│   └── models/         # Generated TS interfaces
├── scripts/            # Code generation scripts
└── justfile            # Task automation
```

## Development

```bash
# Validate schemas and regenerate bindings (TS + Rust)
loru run gen

# Run checks (schema validation + TS type-check + Rust fmt/check/clippy/test)
loru dev check
```

Common `loru run` tasks are declared in `loru.toml`. Git hooks (`loru dev init githooks`) and build/cache layout (`loru dev init buildsys`) are managed by the shared CLI.

## License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](LICENSE) file for details.

---

Part of the [Loru](https://github.com/hiisi-digital/loru) platform.
