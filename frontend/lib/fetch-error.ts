type ApiErrorPayload = {
  result?: string;
  reasoning?: string;
  error?: string;
  message?: string;
};

export async function readFetchError(
  response: Response,
  agentName = "API"
): Promise<string> {
  const text = (await response.text()).trim();

  if (text) {
    try {
      const json = JSON.parse(text) as ApiErrorPayload;
      return (
        json.reasoning ||
        json.result ||
        json.error ||
        json.message ||
        text
      );
    } catch {
      return text;
    }
  }

  if (response.status === 504) {
    return `${agentName} timed out (HTTP 504). The server or Gemini request took too long — retry or check GEMINI_API_KEY in .env.local.`;
  }

  if (response.status === 503) {
    return `${agentName} unavailable (HTTP 503). Check GEMINI_API_KEY in frontend/.env.local.`;
  }

  return `${agentName} failed (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}).`;
}
