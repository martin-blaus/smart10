import { doc, getDoc, writeBatch, increment } from "firebase/firestore";
import { db } from "./config";

export interface UserVote {
  userId: string;
  targetId: string; // cardId or deckId
  vote: "like" | "dislike";
  timestamp: string;
}

/**
 * Register or update a user's vote on a card.
 */
export async function voteCard(userId: string, cardId: string, voteType: "like" | "dislike") {
  if (!userId || !cardId) return;

  const voteDocId = `${userId}_${cardId}`;
  const voteRef = doc(db, "cardVotes", voteDocId);
  const cardRef = doc(db, "cards", cardId);

  const voteSnap = await getDoc(voteRef);
  const batch = writeBatch(db);

  if (!voteSnap.exists()) {
    // 1. First time voting
    batch.set(voteRef, {
      userId,
      cardId,
      vote: voteType,
      timestamp: new Date().toISOString()
    });
    batch.update(cardRef, {
      [voteType === "like" ? "likesCount" : "dislikesCount"]: increment(1)
    });
  } else {
    const existingVote = voteSnap.data() as UserVote;
    if (existingVote.vote !== voteType) {
      // 2. Change vote type (e.g. from like to dislike)
      batch.update(voteRef, {
        vote: voteType,
        timestamp: new Date().toISOString()
      });
      batch.update(cardRef, {
        [voteType === "like" ? "likesCount" : "dislikesCount"]: increment(1),
        [existingVote.vote === "like" ? "likesCount" : "dislikesCount"]: increment(-1)
      });
    } else {
      // 3. Retract/delete vote (clicked same button again)
      batch.delete(voteRef);
      batch.update(cardRef, {
        [voteType === "like" ? "likesCount" : "dislikesCount"]: increment(-1)
      });
    }
  }

  await batch.commit();
}

/**
 * Register or update a user's vote on a deck.
 */
export async function voteDeck(userId: string, deckId: string, voteType: "like" | "dislike") {
  if (!userId || !deckId) return;

  const voteDocId = `${userId}_${deckId}`;
  const voteRef = doc(db, "deckVotes", voteDocId);
  const deckRef = doc(db, "decks", deckId);

  const voteSnap = await getDoc(voteRef);
  const batch = writeBatch(db);

  if (!voteSnap.exists()) {
    // 1. First time voting
    batch.set(voteRef, {
      userId,
      deckId,
      vote: voteType,
      timestamp: new Date().toISOString()
    });
    batch.update(deckRef, {
      [voteType === "like" ? "likesCount" : "dislikesCount"]: increment(1)
    });
  } else {
    const existingVote = voteSnap.data() as UserVote;
    if (existingVote.vote !== voteType) {
      // 2. Change vote type
      batch.update(voteRef, {
        vote: voteType,
        timestamp: new Date().toISOString()
      });
      batch.update(deckRef, {
        [voteType === "like" ? "likesCount" : "dislikesCount"]: increment(1),
        [existingVote.vote === "like" ? "likesCount" : "dislikesCount"]: increment(-1)
      });
    } else {
      // 3. Retract/delete vote
      batch.delete(voteRef);
      batch.update(deckRef, {
        [voteType === "like" ? "likesCount" : "dislikesCount"]: increment(-1)
      });
    }
  }

  await batch.commit();
}

/**
 * Fetch a single vote for a card by a user.
 */
export async function getUserCardVote(userId: string, cardId: string): Promise<"like" | "dislike" | null> {
  if (!userId || !cardId) return null;
  const voteRef = doc(db, "cardVotes", `${userId}_${cardId}`);
  const snap = await getDoc(voteRef);
  if (!snap.exists()) return null;
  return snap.data().vote as "like" | "dislike";
}

/**
 * Fetch a single vote for a deck by a user.
 */
export async function getUserDeckVote(userId: string, deckId: string): Promise<"like" | "dislike" | null> {
  if (!userId || !deckId) return null;
  const voteRef = doc(db, "deckVotes", `${userId}_${deckId}`);
  const snap = await getDoc(voteRef);
  if (!snap.exists()) return null;
  return snap.data().vote as "like" | "dislike";
}
