# LLMS.TXT Generator

## Overview

This Astro app for Webflow Cloud allows you to create an `llms.txt` file containing links to markdown pages for the live pages and collections on your Webflow site. You can choose which pages and collections to include in your `llms.txt` file. Additionally, you can set up a webhook to hit the `/base_path/api/webhooks` endpoint to update your `llms.txt` file automatically on each site publish.

## Tech Stack

- [Astro](https://astro.build/)
- Key Value (KV) storage for page data and user preferences

## Installation

1. **Clone this repository:**
   ```bash
   git clone https://github.com/victoriaplummer/llms-test.git
   cd llms-test
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Create a Webflow Cloud project** and connect it to this repository.
   ```
   npm install -g @webflow/webflow-cli
   ```
4. **Create an environment** in Webflow Cloud and add the required environment variables.
5. **Deploy the app** to Webflow Cloud.

## Usage

- After deployment, visit your app's dashboard to select which pages and collections to include in your `llms.txt` file.
- To automate updates, configure a webhook in Webflow to call the `/base_path/api/webhooks` endpoint on each site publish.

## To-Do

- [ ] Optimize page selectors
- [ ] Fix error on generating `llms.txt`
- [ ] Improve non-Markdown formatting and collection item formatting

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE) (or specify your license here)
