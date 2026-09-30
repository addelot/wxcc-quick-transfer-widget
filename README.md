# Webex Contact Center Quick Transfer Widget

A small Webex Contact Center Desktop custom Web Component with six Quick Transfer buttons.

Currently configured:

- **Sales** → blind transfer to **+46709246443**
- Billing → placeholder
- Technical Support → placeholder
- Reception → placeholder
- Manager → placeholder
- Other → placeholder

The Sales button is enabled when the widget detects an active interaction and calls the Webex Contact Center Desktop SDK `blindTransferV2()` with `destinationType: "dialNumber"`.

## Build

Requires Node.js 20+.

```bash
npm install
npm run build
```

The bundle is generated as:

```text
dist/quick-transfer.js
```

## GitHub Pages

You can upload this project to GitHub and publish the `dist` directory with GitHub Pages. The included workflow is configured to build the widget and deploy the `dist` directory.

After Pages is enabled, the widget URL will normally be:

```text
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY/quick-transfer.js
```

Replace the placeholder URL in the supplied Desktop Layout JSON with your actual URL.

## Webex Contact Center layout

The supplied layout JSON replaces the existing Quick Transfer placeholder panel with:

```json
{
  "comp": "wxcc-quick-transfer",
  "script": "https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY/quick-transfer.js",
  "wrapper": {
    "title": "Quick Transfer",
    "maximizeAreaName": "app-maximize-area"
  }
}
```

The same widget is placed in both the `agent` and `supervisorAgent` Quick Transfer tabs in the supplied layout.

## Important

The widget must run inside Webex Contact Center Desktop. The SDK is initialized by the widget itself and is not intended to run as a standalone webpage.
