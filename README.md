# Nyota Fusion AI Webhook

This is a minimal Node.js + Express server that:
- Accepts POST requests at `/webhook` and displays the latest received JSON payload on the home page (`/`).
- Uses plain HTML (no front-end frameworks).

## Usage

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the server:
   ```sh
   npm start
   ```
3. Visit [http://localhost:3000](http://localhost:3000) to view the latest payload.
4. POST JSON to [http://localhost:3000/webhook](http://localhost:3000/webhook) to update the display.

## Example

```sh
curl -X POST http://localhost:3000/webhook \
  -H 'Content-Type: application/json' \
  -d '{"hello": "world"}'
```

