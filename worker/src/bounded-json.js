export async function readBoundedJson(
  request,
  maximum,
  makeError,
  invalidCode = "invalid_request",
) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(length) && length > maximum) {
    throw makeError(413, "request_too_large");
  }
  const reader = request.body?.getReader();
  if (!reader) throw makeError(400, invalidCode);

  const decoder = new TextDecoder("utf-8", { fatal: true });
  let receivedBytes = 0;
  let raw = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedBytes += value.byteLength;
    if (receivedBytes > maximum) {
      try {
        await reader.cancel("request_too_large");
      } catch {
        // Preserve the stable 413 response if the source rejects cancellation.
      }
      throw makeError(413, "request_too_large");
    }
    try {
      raw += decoder.decode(value, { stream: true });
    } catch {
      try {
        await reader.cancel("invalid_utf8");
      } catch {
        // Preserve the stable invalid request response.
      }
      throw makeError(400, invalidCode);
    }
  }
  try {
    raw += decoder.decode();
    return JSON.parse(raw);
  } catch {
    throw makeError(400, invalidCode);
  }
}
