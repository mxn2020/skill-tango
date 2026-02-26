import { internal } from "./_generated/api";

type NvidiaMessage = {
    role: "system" | "user" | "assistant";
    content: string | Array<{ type: "text", text: string } | { type: "image_url", image_url: { url: string } }>;
};

// Extract text-only content from messages (strip base64 images for log readability)
function extractPromptText(messages: NvidiaMessage[]): {
    systemPrompt: string
    userPromptText: string
    hasImage: boolean
    imageSizeBytes: number
} {
    let systemPrompt = ''
    let userPromptText = ''
    let hasImage = false
    let imageSizeBytes = 0

    for (const msg of messages) {
        if (typeof msg.content === 'string') {
            if (msg.role === 'system') systemPrompt = msg.content
            else userPromptText += msg.content
        } else if (Array.isArray(msg.content)) {
            for (const part of msg.content) {
                if (part.type === 'text' && part.text) {
                    if (msg.role === 'system') systemPrompt = part.text
                    else userPromptText += part.text
                }
                if (part.type === 'image_url' && part.image_url?.url) {
                    hasImage = true
                    imageSizeBytes = part.image_url.url.length
                }
            }
        }
    }

    return { systemPrompt, userPromptText, hasImage, imageSizeBytes }
}

/**
 * Universal wrapper for calling NVIDIA NIMs.
 * Handles fetch logic, error checking, token tracking, and automatic saving to the aiLogs table.
 */
export async function performNvidiaCall(ctx: any, args: {
    model: string,
    messages: NvidiaMessage[],
    temperature?: number,
    maxTokens?: number,
    topP?: number,
    caller?: string,
    responseFormat?: any
}): Promise<string> {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
        throw new Error("NVIDIA_API_KEY is not configured in Convex environment variables.");
    }

    const { model, messages, temperature = 0.7, maxTokens = 2048, topP = 0.9, caller = 'unknown', responseFormat } = args;

    // Construct body
    const bodyObj: any = { model, messages, temperature, max_tokens: maxTokens, top_p: topP, stream: false };
    if (responseFormat) {
        bodyObj.response_format = responseFormat;
    }

    const bodyStr = JSON.stringify(bodyObj);
    const requestBodySize = bodyStr.length;
    const promptInfo = extractPromptText(messages);

    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = Date.now();

    let httpStatus = 0;
    let responseContent = '';
    let finishReason: string | undefined;
    let promptTokens: number | undefined;
    let completionTokens: number | undefined;
    let totalTokens: number | undefined;
    let errorMessage: string | undefined;
    let status: 'success' | 'error' = 'success';

    console.log(`[NVIDIA API Action] [${requestId}] Calling model: ${model} (caller: ${caller})`);

    const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
    const MAX_RETRIES = 3;

    try {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: bodyStr,
                });

                httpStatus = response.status;
                if (!response.ok) {
                    const errorText = await response.text();

                    // Retry on transient errors
                    if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < MAX_RETRIES) {
                        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
                        console.log(`[NVIDIA API Action] [${requestId}] Attempt ${attempt}/${MAX_RETRIES} failed (HTTP ${response.status}). Retrying in ${delay}ms...`);
                        lastError = new Error(`NVIDIA API error (${response.status}): ${errorText}`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }

                    status = 'error';
                    errorMessage = errorText.substring(0, 2000);
                    throw new Error(`NVIDIA API error (${response.status}): ${errorText}`);
                }

                const data = await response.json() as any;
                responseContent = data.choices?.[0]?.message?.content ?? '';
                finishReason = data.choices?.[0]?.finish_reason;
                promptTokens = data.usage?.prompt_tokens;
                completionTokens = data.usage?.completion_tokens;
                totalTokens = data.usage?.total_tokens;

                if (!responseContent) {
                    status = 'error';
                    errorMessage = `Empty content. Finish: ${finishReason}, Tokens: ${completionTokens}`;
                    throw new Error(errorMessage);
                }

                if (attempt > 1) {
                    console.log(`[NVIDIA API Action] [${requestId}] Succeeded on attempt ${attempt}/${MAX_RETRIES}`);
                }

                return responseContent;
            } catch (fetchErr) {
                lastError = fetchErr instanceof Error ? fetchErr : new Error('Unknown error');

                // If it's a network error (no httpStatus set) and we have retries left, retry
                if (httpStatus === 0 && attempt < MAX_RETRIES) {
                    const delay = Math.pow(2, attempt - 1) * 1000;
                    console.log(`[NVIDIA API Action] [${requestId}] Attempt ${attempt}/${MAX_RETRIES} failed (network error). Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                throw fetchErr;
            }
        }

        // Should not reach here, but just in case
        throw lastError || new Error('All retry attempts exhausted');
    } catch (err) {
        if (status !== 'error') {
            status = 'error';
            errorMessage = err instanceof Error ? err.message : 'Unknown error';
        }
        throw err;
    } finally {
        const durationMs = Date.now() - timestamp;

        try {
            await ctx.runMutation(internal.aiLogs.saveLog, {
                requestId,
                model,
                caller,
                timestamp,
                durationMs,
                systemPrompt: promptInfo.systemPrompt.substring(0, 2000),
                userPromptText: promptInfo.userPromptText.substring(0, 2000),
                hasImage: promptInfo.hasImage,
                imageSizeBytes: promptInfo.imageSizeBytes || undefined,
                temperature,
                maxTokens,
                requestBodySize,
                status,
                httpStatus,
                responseContent: responseContent.substring(0, 8000),
                responseSize: responseContent.length,
                finishReason,
                promptTokens,
                completionTokens,
                totalTokens,
                errorMessage,
            });
        } catch (logErr) {
            console.error("[NVIDIA API Action] Failed to save log entry:", logErr);
        }
    }
}
