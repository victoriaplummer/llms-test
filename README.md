# Webflow Collection Manager

A powerful tool built with Astro and React that helps manage and expose Webflow collections through a user-friendly interface. This project allows you to selectively expose Webflow collections and their fields, manage page settings, and generate LLM-friendly content.

## 🚀 Features

- Collection management interface
- Field-level visibility control
- Custom display names and descriptions
- Page settings management
- Automatic LLM content generation
- Cloudflare Workers integration

## 📋 Prerequisites

- Node.js (v16 or later)
- npm or yarn
- A Webflow account with API access
- Cloudflare account (for deployment)

## 🛠 Setup

1. Clone the repository:

```bash
git clone [repository-url]
cd [project-name]
```

2. Install dependencies:

```bash
npm install
```

3. Create environment variables:
   Create a `.env` file with the following variables:

```env
PUBLIC_WEBFLOW_SITE_API_TOKEN=your_webflow_api_token
PUBLIC_WEBFLOW_SITE_ID=your_webflow_site_id
```

4. Start the development server:

```bash
npm run dev
```

## 🏗 Project Structure

```
/
├── src/
│   ├── components/          # React and Astro components
│   │   ├── CollectionManager.tsx  # Main collection management interface
│   │   ├── PageManager.tsx        # Page settings management
│   │   ├── Navigation.astro       # Site navigation
│   │   └── Toast.astro           # Notification component
│   │
│   ├── pages/              # Astro pages and API routes
│   │   ├── admin/          # Admin interface pages
│   │   └── api/           # API endpoints
│   │
│   ├── utils/             # Utility functions and types
│   │   ├── webflow/       # Webflow API integration
│   │   └── types.ts       # TypeScript type definitions
│   │
│   └── services/          # Business logic services
│
└── public/               # Static assets
```

## 📚 API Documentation

### Admin Endpoints

- `POST /api/admin/save-exposure-settings`

  - Updates collection exposure settings
  - Body: `{ collections: { [id: string]: CollectionSettings } }`

- `GET /api/admin/get-collection-schema`

  - Retrieves schema for a specific collection
  - Query: `?id={collectionId}`

- `POST /api/admin/save-page-settings`
  - Updates page visibility settings
  - Body: `{ pages: { [id: string]: PageSettings } }`

### Public Endpoints

- `GET /api/collections`

  - Lists all exposed collections
  - Returns: `{ collections: Collection[] }`

- `GET /api/pages`
  - Lists all exposed pages
  - Returns: `{ pages: Page[] }`

## 🔧 Configuration

The project uses several configuration files:

- `astro.config.mjs` - Astro configuration
- `tailwind.config.mjs` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `wrangler.json` - Cloudflare Workers configuration

## 📦 Deployment

This project is designed to be deployed to Cloudflare Workers:

1. Build the project:

```bash
npm run build
```

2. Deploy to Cloudflare:

```bash
npm run preview # Test locally first
wrangler deploy # Deploy to Cloudflare
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

[Your License Here]

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
