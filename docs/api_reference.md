# API Reference

Roommate exposes several HTTP endpoints for memory, chat, and integrations.

## Main Endpoints

### Memory
- `POST /memory/save` — Save user information
- `GET /memory/get` — Retrieve user memories

### Chat
- `POST /chat/send` — Send a chat message
- `GET /chat/history` — Get chat history

### Integrations
- Sentry, Nightwatch, ESP32, and more

## Example Request
```http
POST /memory/save
Content-Type: application/json
{
  "userId": "user-123",
  "type": "location",
  "key": "city",
  "value": "New York"
}
```

## Authentication
- Most endpoints require an API key or user token.

## Error Codes
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing/invalid token
- `500 Internal Server Error`: Unexpected error