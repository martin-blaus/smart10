import { ref, set, get, update, onDisconnect, serverTimestamp } from "firebase/database";
import { rtdb } from "../firebase/config";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface RoomPlayer {
  name: string;
  token: string;
  joinedAt: number;
  connected: boolean;
}

export interface RoomSettings {
  targetScore: number;
  deckChoice: string;
}

export interface Room {
  createdAt: object;
  hostUid: string;
  status: "lobby" | "playing" | "finished";
  settings: RoomSettings;
  players: Record<string, RoomPlayer>;
  order: string[];
  game: {
    state: any; // GameState JSON
    version: number;
  } | null;
}

/**
 * Generate a random 4-character uppercase alphanumeric room code.
 * Excludes confusing characters like 0, O, 1, I.
 */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[idx];
  }
  return code;
}

/**
 * Create a new room in Firebase RTDB.
 */
export async function createRoom(
  code: string,
  hostUid: string,
  hostName: string,
  hostToken: string,
  targetScore: number = 15,
  deckChoice: string = "general"
) {
  const roomRef = ref(rtdb, `rooms/${code}`);
  
  // Verify room doesn't exist already
  const snap = await get(roomRef);
  if (snap.exists()) {
    throw new Error("Room code already exists. Please retry.");
  }

  const roomData = {
    createdAt: serverTimestamp(),
    hostUid,
    status: "lobby",
    settings: {
      targetScore,
      deckChoice,
    },
    players: {
      [hostUid]: {
        name: hostName,
        token: hostToken,
        joinedAt: Date.now(),
        connected: true,
      },
    },
    order: [hostUid],
    game: null,
  };

  await set(roomRef, roomData);
  setupPresence(code, hostUid);
}

/**
 * Join an existing room in Firebase RTDB.
 */
export async function joinRoom(code: string, uid: string, name: string, token: string) {
  const roomRef = ref(rtdb, `rooms/${code}`);
  const snap = await get(roomRef);
  if (!snap.exists()) {
    throw new Error("La sala no existe.");
  }

  const room = snap.val() as Room;
  if (room.status !== "lobby") {
    throw new Error("La partida ya comenzó o terminó.");
  }

  if (room.players && Object.keys(room.players).length >= 8) {
    throw new Error("La sala está llena (máximo 8 jugadores).");
  }

  // Update players list and order
  const updates: Record<string, any> = {};
  updates[`players/${uid}`] = {
    name,
    token,
    joinedAt: Date.now(),
    connected: true,
  };

  if (!room.order.includes(uid)) {
    updates["order"] = [...room.order, uid];
  }

  await update(roomRef, updates);
  setupPresence(code, uid);
}

/**
 * Setup connection monitoring to set connected: false on player disconnect.
 */
export function setupPresence(code: string, uid: string) {
  const playerConnectedRef = ref(rtdb, `rooms/${code}/players/${uid}/connected`);
  // When disconnected from the Firebase server, set connected to false
  onDisconnect(playerConnectedRef).set(false);
}

/**
 * Leave a room. If host leaves, we can handle it (optional/V1 alerts user).
 */
export async function leaveRoom(code: string, uid: string) {
  const roomRef = ref(rtdb, `rooms/${code}`);
  const snap = await get(roomRef);
  if (!snap.exists()) return;

  const room = snap.val() as Room;
  const updates: Record<string, any> = {};

  // Remove player
  updates[`players/${uid}`] = null;
  updates["order"] = room.order.filter(id => id !== uid);

  // If host leaves, and other players are left, designate a new host (or end room)
  if (room.hostUid === uid) {
    const remainingPlayers = room.order.filter(id => id !== uid);
    if (remainingPlayers.length > 0) {
      updates["hostUid"] = remainingPlayers[0];
    } else {
      // Room empty, remove room
      await set(roomRef, null);
      return;
    }
  }

  await update(roomRef, updates);
}
