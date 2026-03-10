import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AnalyzeResponse } from "@/lib/types";

// Edge runtime — faster cold starts on Vercel
export const runtime = "edge";

const MODEL_IMAGE = "claude-sonnet-4-6";
const MODEL_TEXT = "claude-haiku-4-5-20251001";

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
type AllowedMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

// ── Rate limiting (simple in-memory, per-IP, resets on cold start) ────
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

// ── System prompt (improved for multi-meal, restaurant, batch) ────────
const SYSTEM_PROMPT = `You are a meal ingredient analyzer for Plate2Offset, an app that helps users offset their animal product consumption.

INSTRUCTIONS:
1. Identify ALL ingredients from the meal description or photo.
2. Handle multiple meals in one request (e.g. "eggs for breakfast, burger for lunch").
3. When a restaurant or chain is mentioned (e.g. "Chipotle chicken burrito bowl"), use your knowledge of their standard menu items and typical portion sizes.
4. For vague quantities ("some cheese", "a bit of cream"), estimate reasonable typical serving sizes.
5. Always estimate amounts in grams when possible — this gives the most accurate offset calculation.

For each ingredient return:
- name: a short human-readable name
- category: one of "red-meat", "poultry", "pork", "fish-seafood", "dairy", "eggs", or "other" (plant-based)
- amount: your best estimate (number)
- unit: one of "g", "oz", "ml", "cups", "pieces", "servings"
- confidence: 0–1 (use 0.5 or below if guessing)

Include ALL ingredients — both animal and plant-based — so the user can verify completeness.`;

// ── Tool definition for structured output ─────────────────────────────
const ANALYZE_TOOL: Anthropic.Messages.Tool = {
  name: "report_meal_analysis",
  description: "Report the complete analysis of all meal ingredients found.",
  input_schema: {
    type: "object" as const,
    properties: {
      items: {
        type: "array",
        description: "All identified ingredients",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Short human-readable name, e.g. 'cheddar cheese'",
            },
            category: {
              type: "string",
              enum: [
                "red-meat",
                "poultry",
                "pork",
                "fish-seafood",
                "dairy",
                "eggs",
                "other",
              ],
            },
            amount: {
              type: "number",
              description: "Estimated amount",
            },
            unit: {
              type: "string",
              enum: ["g", "oz", "ml", "cups", "pieces", "servings"],
            },
            confidence: {
              type: "number",
              description: "Confidence 0–1",
            },
          },
          required: ["name", "category", "amount", "unit", "confidence"],
        },
      },
      note: {
        type: ["string", "null"],
        description:
          "Optional note when something is unclear or worth mentioning",
      },
    },
    required: ["items"],
  },
};

// ── Result cache (in-memory, avoids re-analyzing identical inputs) ─────
const resultCache = new Map<string, AnalyzeResponse>();
const CACHE_MAX = 100;

async function hashInput(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data.slice(0, 5000)));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Main handler ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Anthropic API key is not configured. Add ANTHROPIC_API_KEY to your .env.local file.",
      },
      { status: 500 },
    );
  }

  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const { description, photoBase64 } = body as {
    description?: string;
    photoBase64?: string;
  };

  if (!description && !photoBase64) {
    return NextResponse.json(
      { error: "Please provide a meal description or photo." },
      { status: 400 },
    );
  }

  // Check result cache (text descriptions and photo-only requests)
  const cacheInput = description ?? photoBase64 ?? "";
  const cacheKey = await hashInput(cacheInput);
  const cached = resultCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Build the message content
  const userContent: Anthropic.MessageCreateParams["messages"][0]["content"] =
    [];

  if (photoBase64) {
    const match = photoBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match || !ALLOWED_MEDIA_TYPES.has(match[1])) {
      return NextResponse.json(
        {
          error:
            "Unsupported image format. Please upload a JPEG, PNG, GIF, or WebP image.",
        },
        { status: 400 },
      );
    }
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: match[1] as AllowedMediaType,
        data: match[2],
      },
    });
  }

  if (description) {
    userContent.push({
      type: "text",
      text: `Analyze this meal: ${description}`,
    });
  } else if (photoBase64) {
    userContent.push({
      type: "text",
      text: "Analyze ALL ingredients in this meal photo, including plant-based items.",
    });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: photoBase64 ? MODEL_IMAGE : MODEL_TEXT,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          ...ANALYZE_TOOL,
          cache_control: { type: "ephemeral" },
        },
      ],
      tool_choice: { type: "tool", name: "report_meal_analysis" },
      messages: [{ role: "user", content: userContent }],
    });

    // Extract structured result from tool use block
    const toolBlock = response.content.find(
      (block) => block.type === "tool_use",
    );
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return NextResponse.json(
        { error: "No structured response from AI." },
        { status: 500 },
      );
    }

    const result = toolBlock.input as AnalyzeResponse;

    // Cache result for future identical requests
    if (resultCache.size >= CACHE_MAX) {
      const firstKey = resultCache.keys().next().value;
      if (firstKey) resultCache.delete(firstKey);
    }
    resultCache.set(cacheKey, result);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Anthropic API error:", message);
    return NextResponse.json(
      {
        error: "Something went wrong analyzing your meal. Please try again.",
      },
      { status: 500 },
    );
  }
}
