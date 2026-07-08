import { useEffect, useState } from "react";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase/config";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        try {
          await signInAnonymously(auth);
          // On success onAuthStateChanged fires again with the user, which
          // clears `loading` above — nothing more to do here.
        } catch (error) {
          console.error("Firebase Anonymous Auth Error:", error);
          // Auth failed (e.g. Firebase not yet configured). Stop blocking:
          // offline solo/multiplayer must still be playable without it.
          setLoading(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  return { user, uid: user?.uid ?? null, loading };
}
