# User Management CRUD

Angular 21 user-management CRUD app styled with Bootstrap 5. It uses
[JSONPlaceholder](https://jsonplaceholder.typicode.com/) as its demo API.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer (LTS recommended)
- npm (installed with Node.js)
- Internet access to load JSONPlaceholder users

## Setup

Clone the repository and install the locked dependencies:

```bash
git clone <repository-url>
cd crud
npm ci
```

If you do not have a lockfile available, use `npm install` instead.

## Run locally

```bash
npm start
```

Open `http://localhost:4200/` in a browser. The development server reloads
when source files change.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the local Angular development server |
| `npm test` | Run the Vitest unit tests |
| `npm run build` | Create an optimized production build in `dist/` |

## Features

- Add, edit, and delete user records
- Form validation for names, emails, contacts, and addresses
- Global case-insensitive search
- Sortable table columns
- Pagination and page-size selection

## Demo API behavior

JSONPlaceholder returns 10 users and accepts CRUD requests, but does not
persist writes. The application therefore updates its local in-browser state
after adding, editing, or deleting a user. Refreshing the browser restores the
original JSONPlaceholder data.
