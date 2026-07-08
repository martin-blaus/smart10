import { doc, writeBatch } from "firebase/firestore";
import { db } from "./config";
import { DATASETS } from "../../data";

// Helper map for deck info
const DECK_DETAILS: Record<string, { title: string; description: string }> = {
  argentina: {
    title: "Cultura General Argentina",
    description: "Preguntas de cultura, historia, geografía y costumbres de Argentina."
  },
  general: {
    title: "Cultura General",
    description: "Una mezcla divertida y variada de trivia para todos los gustos."
  },
  asado: {
    title: "Especial de Asado",
    description: "Todo lo que tenés que saber sobre el asado argentino, rituales, cortes y más."
  },
  decadas: {
    title: "Mazo de las Décadas",
    description: "Viajá en el tiempo con preguntas sobre música, hitos históricos y cultura pop."
  }
};

export async function seedDatabase() {
  console.log("Starting Firestore database seeding...");
  
  try {
    for (const [deckKey, cards] of Object.entries(DATASETS)) {
      const details = DECK_DETAILS[deckKey] || {
        title: `Mazo ${deckKey}`,
        description: `Colección de preguntas sobre ${deckKey}.`
      };
      
      const deckId = `deck-${deckKey}`;
      const cardIds = cards.map(c => c.id);
      
      // 1. Create/Overwrite Deck Document
      const deckRef = doc(db, "decks", deckId);
      const batch = writeBatch(db);
      
      batch.set(deckRef, {
        id: deckId,
        title: details.title,
        description: details.description,
        cardIds,
        likesCount: 0,
        dislikesCount: 0,
        creatorId: "system",
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      // 2. Create/Overwrite Card Documents
      for (const card of cards) {
        const cardRef = doc(db, "cards", card.id);
        
        // Clean options undefined fields if any (JSON structure has options)
        const cleanedOptions = card.options.map(opt => {
          const cleanOpt: any = { text: opt.text };
          if ('correct' in opt && opt.correct !== undefined) cleanOpt.correct = opt.correct;
          if ('answer' in opt && opt.answer !== undefined) cleanOpt.answer = opt.answer;
          if ('info' in opt && opt.info !== undefined) cleanOpt.info = opt.info;
          return cleanOpt;
        });

        batch.set(cardRef, {
          id: card.id,
          type: card.type || "boolean",
          category: card.category,
          question: card.question,
          options: cleanedOptions,
          likesCount: 0,
          dislikesCount: 0,
          creatorId: "system",
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
      
      console.log(`Seeding batch for deck: ${deckKey}...`);
      await batch.commit();
      console.log(`Deck ${deckKey} with ${cards.length} cards seeded successfully.`);
    }
    
    console.log("Firestore database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding Firestore:", error);
  }
}
