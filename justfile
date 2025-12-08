# ============================================================================
# LORU SCHEMAS - Task Automation
# ============================================================================
# Shared data models and schema definitions
# Generates code for Deno (TypeScript) and Rust

# Default task
default:
    @just --list

# ============================================================================
# CODE GENERATION
# ============================================================================

# Generate all artifacts
gen: validate gen-ts gen-rust

# Generate TypeScript models
gen-ts:
    deno run -A scripts/generate-ts.ts
    @echo "✓ TypeScript models generated"

# Generate Rust models
gen-rust:
    deno run -A scripts/generate-rust.ts
    @echo "✓ Rust models generated"

# Validate schema definitions
validate:
    deno run -A scripts/validate-schemas.ts

# ============================================================================
# CHECKING
# ============================================================================

# Run all checks
check: taplo-check check-ts check-rust
    @echo "✓ All checks passed"

# Check generated TypeScript code
check-ts:
    if test -f typescript/mod.ts; then deno check typescript/mod.ts; else echo "No TypeScript output yet"; fi

# Check generated Rust code
check-rust:
    if test -f rust/Cargo.toml; then cd rust && cargo check && cargo clippy && cargo test; else echo "No Rust crate yet"; fi

# Publish (manual; tags handled via GH release workflow)
publish-jsr:
    deno publish

# Check TOML formatting and linting (requires taplo)
taplo-check:
    if ! command -v taplo >/dev/null 2>&1; then echo "Taplo is required. Install with 'cargo install taplo-cli' or 'brew install taplo'."; exit 1; fi
    taplo fmt --check
    taplo lint

# ============================================================================
# FORMATTING
# ============================================================================

# Format all code
fmt:
    deno fmt
    cd rust && cargo fmt

# ============================================================================
# DATABASE MIGRATIONS
# ============================================================================

# Create a new migration
new-migration name:
    cd rust && sqlx migrate add -r {{name}}

# ============================================================================
# UTILITIES
# ============================================================================

# Clean build artifacts
clean:
    rm -rf typescript/dist
    cd rust && cargo clean

# Update dependencies
update:
    deno cache --reload scripts/*.ts
    cd rust && cargo update
