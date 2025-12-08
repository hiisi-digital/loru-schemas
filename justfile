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
check: check-ts check-rust
    @echo "✓ All checks passed"

# Check generated TypeScript code
check-ts:
    cd typescript && deno task check

# Check generated Rust code
check-rust:
    cd rust && cargo check
    cd rust && cargo clippy
    cd rust && cargo test

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
