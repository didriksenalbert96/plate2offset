import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AnalyzeResponse } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a meal ingredient analyzer. Given a meal description or photo, identify ALL ingredients you can see or infer.

For each ingredient, return:
- name: a short human-readable name (e.g. "cheddar cheese", "chicken breast", "brown rice", "mixed salad")
- category: one of "red-meat", "poultry", "pork", "fish-seafood", "dairy", "eggs", or "other"
  Use "other" for plant-based items (vegetables, grains, bread, sauces, etc.)
- amount: your best estimate of the amount in the meal (as a number)
- unit: one of "g", "oz", "ml", "cups", "pieces", "servings"
- confidence: a number from 0 to 1 indicating how sure you are (use 0.5 or below if guessing)

Include ALL ingredients, both animal products and plant-based items. This helps the user verify that the analysis is complete.

If something is unclear, set confidence low and add a note explaining what you're unsure about.

Always respond with valid JSON matching this exact structure:
{
  "items": [
    {
      "name": "string",
      "category": "red-meat" | "poultry" | "pork" | "fish-seafood" | "dairy" | "eggs" | "other",
      "amount": number,
      "unit": "g" | "oz" | "ml" | "cups" | "pieces" | "servings",
      "confidence": number
    }
  ],
  "note": "optional string or null"
}

Respond ONLY with the JSON object. No other text.`;

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Anthropic API key is not configured. Add ANTHROPIC_API_KEY to your .env.local file." },
      { status: 500 }
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
      { status: 400 }
    );
  }

  // Build the message content
  const userContent: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

  if (photoBase64) {
    // photoBase64 is a data URL like "data:image/jpeg;base64,/9j/4AAQ..."
    // Claude needs the base64 data and media type separately
    const match = photoBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: match[2],
        },
      });
    }
  }

  if (description) {
    userContent.push({
      type: "text",
      text: `Meal description: ${description}`,
    });
  } else if (photoBase64) {
    userContent.push({
      type: "text",
      text: "Analyze ALL ingredients in this meal photo, including plant-based items.",
    });
  }

  try {
    const response = await anthropic.messages.create({
      model: photoBase64 ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 500 });
    }

    const result: AnalyzeResponse = JSON.parse(textBlock.text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json(
      { error: "Something went wrong analyzing your meal. Please try again." },
      { status: 500 }
    );
  }
}
