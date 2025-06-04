# Dream Interpreter Backend

A TypeScript-based backend service that uses ChatGPT API to interpret dreams and provide meaningful insights.

## Features

- Dream interpretation using ChatGPT API
- Input validation
- Error handling
- Logging
- Security middleware (CORS, Helmet)

## Prerequisites

- Node.js (v14 or higher)
- Yarn package manager
- OpenAI API key

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Development

To start the development server:
```bash
yarn dev
```

## Building for Production

To build the project:
```bash
yarn build
```

To start the production server:
```bash
yarn start
```

## API Endpoints

### POST /api/dreams/interpret

Interpret a dream using ChatGPT.

Request body:
```json
{
  "dreamText": "Your dream description here"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "interpretation": "ChatGPT's interpretation of your dream"
  }
}
```

## Error Handling

The API returns appropriate error messages with corresponding HTTP status codes:

- 400: Bad Request (validation errors)
- 500: Internal Server Error