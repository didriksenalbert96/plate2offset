import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { AnalyzeResponse } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * The system prompt tells the AI what we want:
 * - Identify animal-product ingredients in a meal
 * - Return structured JSON matching our AnalyzeResponse type
 * - Be honest when uncertain (set low confidence)
 */
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
  "note": "optional string"
}`;

export async function POST(request: NextRequest) {
  // Check that the API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured. Add OPENAI_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { description, photoBase64 } = body as {
    description?: string;
    photoBase64?: string;
  };

  // Must have at least one input
  if (!description && !photoBase64) {
    return NextResponse.json(
      { error: "Please provide a meal description or photo." },
      { status: 400 }
    );
  }

  // Build the message content — either text, image, or both
  const userContent: OpenAI.Responses.ResponseInputContent[] = [];

  if (photoBase64) {
    userContent.push({
      type: "input_image",
      image_url: photoBase64,
      detail: "auto",
    });
  }

  if (description) {
    userContent.push({
      type: "input_text",
      text: `Meal description: ${description}`,
    });
  } else if (photoBase64) {
    userContent.push({
      type: "input_text",
      text: "Analyze ALL ingredients in this meal photo, including plant-based items.",
    });
  }

  try {
    const response = await openai.responses.create({
      model: photoBase64 ? "gpt-4o" : "gpt-4o-mini",
      store: false,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "analyze_meal",
          strict: true,
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    category: {
                      type: "string",
                      enum: ["red-meat", "poultry", "pork", "fish-seafood", "dairy", "eggs", "other"],
                    },
                    amount: { type: "number" },
                    unit: {
                      type: "string",
                      enum: ["g", "oz", "ml", "cups", "pieces", "servings"],
                    },
                    confidence: { type: "number" },
                  },
                  required: ["name", "category", "amount", "unit", "confidence"],
                  additionalProperties: false,
                },
              },
              note: { type: ["string", "null"] },
            },
            required: ["items", "note"],
            additionalProperties: false,
          },
        },
      },
    });

    // Extract the text from the response
    const textOutput = response.output.find((o) => o.type === "message");
    if (!textOutput || textOutput.type !== "message") {
      return NextResponse.json({ error: "No response from AI." }, { status: 500 });
    }

    const textContent = textOutput.content.find((c) => c.type === "output_text");
    if (!textContent || textContent.type !== "output_text") {
      return NextResponse.json({ error: "No text in AI response." }, { status: 500 });
    }

    const result: AnalyzeResponse = JSON.parse(textContent.text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("OpenAI API error:", err);
    return NextResponse.json(
      { error: "Something went wrong analyzing your meal. Please try again." },
      { status: 500 }
    );
  }
}
