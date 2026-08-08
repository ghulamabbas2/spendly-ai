# Spendly AI — Git Conventions

How we commit, branch, and merge. See [`coding-standards.md`](coding-standards.md) for code-level conventions.

## Commit messages — Conventional Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): a **type**, followed by a **short imperative subject**.

```
<type>: <short imperative subject>
```

**Types:**

| Type | Use for |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Tooling, config, dependencies, housekeeping |

**Subject rules:**

- **Imperative mood** — "add expense form", not "added" or "adds".
- Short — aim for ~50 characters or less.
- Lowercase, no trailing period.

```
feat: add expense entry form
fix: correct tab bar navigation on Android
docs: document RLS policies
refactor: extract currency formatting into lib
test: cover expenses service error path
chore: bump react-native to 0.86
```

## Branches

Name branches by **type/feature**, using the same types as commits:

```
<type>/<short-feature-name>
```

```
feat/add-expense
fix/tab-nav
docs/architecture
refactor/expenses-service
```

- Kebab-case the feature part.
- Keep it short and descriptive of the change.

## Workflow

- **Each feature on its own branch** — branch off `main`.
- **Merge through a pull request** — never push straight to `main`.
- **Human review before merge** — every PR is reviewed and approved by a person before it lands.
- Keep PRs focused and reasonably small so they're easy to review.
