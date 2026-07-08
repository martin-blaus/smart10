import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { voteCard, getUserCardVote } from "../firebase/voting";
import { strings } from "../i18n/strings";

interface Props {
  cardId: string;
  userId: string | null;
}

export function CardVoting({ cardId, userId }: Props) {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);
  const [voting, setVoting] = useState(false);

  // Subscribe to live card counts
  useEffect(() => {
    if (!cardId) return;
    const cardRef = doc(db, "cards", cardId);
    
    const unsubscribe = onSnapshot(cardRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLikes(data.likesCount || 0);
        setDislikes(data.dislikesCount || 0);
      }
    });

    return unsubscribe;
  }, [cardId]);

  // Fetch initial user vote
  useEffect(() => {
    if (!userId || !cardId) return;
    getUserCardVote(userId, cardId)
      .then(setUserVote)
      .catch(console.error);
  }, [cardId, userId]);

  const handleVote = async (type: "like" | "dislike") => {
    if (!userId || voting) return;
    setVoting(true);
    
    // Optimistic UI update
    const previousVote = userVote;
    const newVote = previousVote === type ? null : type;
    setUserVote(newVote);

    try {
      await voteCard(userId, cardId, type);
    } catch (err) {
      console.error("Error setting vote:", err);
      // Revert on error
      setUserVote(previousVote);
    } finally {
      setVoting(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="panel px-4 py-3.5 w-full flex flex-col gap-2.5 items-center bg-[#1d2d23]/80 backdrop-blur-md border border-brass/10 rounded-2xl">
      <span className="eyebrow text-parchment-dim text-xs font-medium tracking-wide uppercase">
        ¿Qué te pareció esta carta?
      </span>
      
      <div className="flex gap-4 w-full justify-center">
        {/* Like Button */}
        <button
          onClick={() => handleVote("like")}
          disabled={voting}
          aria-pressed={userVote === "like"}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer select-none active:scale-95 text-sm ${
            userVote === "like"
              ? "btn-brass text-parchment font-bold"
              : "panel text-parchment-dim hover:text-parchment border border-brass/10"
          }`}
        >
          <span className="text-base">👍</span>
          <span className="font-display tabular-nums">{likes}</span>
          <span className="sr-only">{strings.onlineLikes}</span>
        </button>

        {/* Dislike Button */}
        <button
          onClick={() => handleVote("dislike")}
          disabled={voting}
          aria-pressed={userVote === "dislike"}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer select-none active:scale-95 text-sm ${
            userVote === "dislike"
              ? "bg-wrong border border-wrong/40 text-parchment font-bold"
              : "panel text-parchment-dim hover:text-parchment border border-brass/10"
          }`}
        >
          <span className="text-base">👎</span>
          <span className="font-display tabular-nums">{dislikes}</span>
          <span className="sr-only">{strings.onlineDislikes}</span>
        </button>
      </div>
    </div>
  );
}
