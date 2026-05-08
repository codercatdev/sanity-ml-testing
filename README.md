# Test Sanity Hierarchy Structure

Populate manually from client using node script. Or use the sanity app sdk.

> Make sure you add CORS in your project -> API -> CORS Origins http://localhost:3334 for SDK App and http://localhost:3333 for Studio.

## Node Script

### Prerequisites
- Add/Update .env.local file at root with Sanity Credentials
- Run `pnpm install` to install dependencies

```bash
pnpm test
```

## Sanity App SDK

### Prerequisites

- Add/Update .env.local file at root with Sanity Credentials
- cd to ml-testing-app
- Run `pnpm install` to install dependencies

### Run

```bash
pnpm dev
```

## Sanity Studio

### Prerequisites

- Add/Update .env.local file at root with Sanity Credentials
- cd to ml-testing-studio
- Run `pnpm install` to install dependencies

### Run

```bash
pnpm dev
```