const DEFAULT_RETRY_STATUSES = [502, 503, 504];

export type AgentFetchOptions = {
  retries?: number;
  retryDelayMs?: number;
  retryOn?: number[];
};

export async function fetchAgentWithRetry(
  url: string,
  init: RequestInit,
  options?: AgentFetchOptions
): Promise<Response> {
  const retries = options?.retries ?? 2;
  const retryDelayMs = options?.retryDelayMs ?? 2000;
  const retryOn = options?.retryOn ?? DEFAULT_RETRY_STATUSES;

  let response = await fetch(url, init);

  for (let attempt = 0; attempt < retries && retryOn.includes(response.status); attempt++) {
    await sleep(retryDelayMs * (attempt + 1));
    response = await fetch(url, init);
  }

  return response;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
