import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Map file extensions to media types Claude's vision API accepts
function mediaTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return { ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" }[ext] || "image/jpeg";
}

export async function generateTweetDescription(imagePath, productName) {
  const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
  const mediaType = mediaTypeFor(imagePath);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 }
          },
          {
            type: "text",
            text: `Regarde cette photo de produit. Nom du produit : "${productName}".
Rédige UNE annonce façon Twitter, en français : percutante, texte brut, moins de 220 caractères, sans markdown, sans guillemets. Tu peux ajouter jusqu'à 2 hashtags pertinents à la fin. Adopte le ton d'un vendeur enthousiaste, pas d'un script publicitaire. Réponds UNIQUEMENT avec le texte de l'annonce, rien d'autre.`
          }
        ]
      }
    ]
  });

  const text = message.content.find((b) => b.type === "text")?.text || "";
  return text.trim();
}
