import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data.json");

// Spotify Credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'a64ec262abd745eeaf4db5faf597d19b';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '67657590909b48afbf1fd45e09400b6b';

let spotifyAccessToken = '';
let spotifyTokenExpiration = 0;

async function getSpotifyToken() {
  if (spotifyAccessToken && Date.now() < spotifyTokenExpiration) {
    return spotifyAccessToken;
  }

  try {
    const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Spotify Token Error:", errorText);
      return null;
    }

    const data: any = await response.json();
    spotifyAccessToken = data.access_token;
    spotifyTokenExpiration = Date.now() + ((data.expires_in - 60) * 1000);
    return spotifyAccessToken;
  } catch (error) {
    console.error("Failed to fetch Spotify token:", error);
    return null;
  }
}

let db = {
  songs: [],
  settings: {},
  messages: []
};

if (fs.existsSync(DATA_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (e) {
    console.error("Failed to parse data.json", e);
  }
}

function saveDb() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Spotify Proxy Routes
  app.get("/api/spotify/*", async (req, res) => {
    const token = await getSpotifyToken();
    if (!token) {
      return res.status(500).json({ error: "Failed to get Spotify token" });
    }

    const spotifyPath = req.params[0];
    const query = new URLSearchParams(req.query as any).toString();
    const url = `https://api.spotify.com/v1/${spotifyPath}${query ? `?${query}` : ""}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Spotify Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch from Spotify" });
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.emit("init", db);

    socket.on("update_settings", (settings) => {
      db.settings = settings;
      saveDb();
      socket.broadcast.emit("settings_updated", settings);
    });

    socket.on("sync_songs", (songs) => {
      db.songs = songs;
      saveDb();
      socket.broadcast.emit("songs_updated", songs);
    });

    socket.on("add_song", (song) => {
      if (!db.songs.find(s => s.id === song.id)) {
        db.songs.unshift(song);
        saveDb();
        socket.broadcast.emit("song_added", song);
      }
    });

    socket.on("update_song", (song) => {
      const index = db.songs.findIndex(s => s.id === song.id);
      if (index !== -1) {
        db.songs[index] = { ...db.songs[index], ...song };
        saveDb();
        socket.broadcast.emit("song_updated", db.songs[index]);
      }
    });

    socket.on("delete_song", (id) => {
      db.songs = db.songs.filter(s => s.id !== id);
      saveDb();
      socket.broadcast.emit("song_deleted", id);
    });

    socket.on("add_message", (msg) => {
      db.messages.unshift(msg);
      saveDb();
      socket.broadcast.emit("message_added", msg);
    });

    socket.on("update_message", (msg) => {
      const index = db.messages.findIndex(m => m.id === msg.id);
      if (index !== -1) {
        db.messages[index] = { ...db.messages[index], ...msg };
        saveDb();
        socket.broadcast.emit("message_updated", db.messages[index]);
      }
    });

    socket.on("delete_message", (id) => {
      db.messages = db.messages.filter(m => m.id !== id);
      saveDb();
      socket.broadcast.emit("message_deleted", id);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
