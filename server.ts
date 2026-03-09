import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data.json");

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
