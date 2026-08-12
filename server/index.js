import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
// Limite generoso: le carte incorporano immagini base64. Con la compressione
// lato Studio restano piccole, ma teniamo ampio margine per non rifiutare mai.
app.use(express.json({ limit: '100mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;
const CARDS_FILE_PATH = path.join(__dirname, 'data', 'cards.json');
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Helper to get local LAN IPv4 address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// In-memory active game rooms
const rooms = new Map();

// Auth self-hosted (registrazione/login/profilo) — rotte /api/auth/* e /api/profile
app.use(authRouter);

// API endpoint to return server LAN IP and status
app.get('/api/info', (req, res) => {
  const localIp = getLocalIp();
  res.json({
    status: 'online',
    ip: localIp,
    port: PORT,
    activeRooms: rooms.size
  });
});

// API endpoint to get all published official cards
app.get('/api/cards', (req, res) => {
  try {
    if (fs.existsSync(CARDS_FILE_PATH)) {
      const data = fs.readFileSync(CARDS_FILE_PATH, 'utf-8');
      res.json(JSON.parse(data || '[]'));
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error('Error reading cards file:', err);
    res.status(500).json({ error: 'Errore lettura carte' });
  }
});

// API endpoint for the Creator to publish cards to the official game
app.post('/api/cards', (req, res) => {
  try {
    const { cards } = req.body;
    if (!Array.isArray(cards)) {
      return res.status(400).json({ error: 'Formato carte non valido' });
    }

    const dir = path.dirname(CARDS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(CARDS_FILE_PATH, JSON.stringify(cards, null, 2), 'utf-8');
    
    // Broadcast updated cards to all connected players in real time
    io.emit('cards_updated', { cards });
    
    console.log(`[CARDS PUBLISHED] ${cards.length} carte pubblicate con successo dal Creatore.`);
    res.json({ success: true, count: cards.length });
  } catch (err) {
    console.error('Error saving cards:', err);
    res.status(500).json({ error: 'Errore salvataggio carte' });
  }
});

// ── Deploy single-box (Oracle Cloud): il server serve anche il frontend ──
// Se esiste la build (dist/), la stessa macchina/porta serve gioco + API + PvP.
// Radice "/" → interfaccia dei colleghi (newui). /index.html resta l'app admin.
if (fs.existsSync(DIST_DIR)) {
  const newuiHtml = path.join(DIST_DIR, 'newui.html');
  const indexHtml = path.join(DIST_DIR, 'index.html');
  app.get('/', (req, res) => {
    res.sendFile(fs.existsSync(newuiHtml) ? newuiHtml : indexHtml);
  });
  app.use(express.static(DIST_DIR));
  console.log('[STATIC] Frontend servito da', DIST_DIR);
}

// Socket.io Real-time multiplayer game synchronization
io.on('connection', (socket) => {
  console.log(`[SOCKET CONNECTED] ID: ${socket.id}`);

  // Host creates a room
  socket.on('host_room', ({ roomId, playerName, deck }) => {
    socket.join(roomId);
    rooms.set(roomId, {
      host: { id: socket.id, name: playerName, deck },
      guest: null,
      gameState: null
    });
    console.log(`[ROOM CREATED] Room ${roomId} by ${playerName}`);
    socket.emit('room_created', { roomId });
  });

  // Guest joins a room
  socket.on('join_room', ({ roomId, playerName, deck }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('join_error', { message: 'Stanza non trovata. Controlla il codice.' });
      return;
    }
    if (room.guest) {
      socket.emit('join_error', { message: 'La stanza è già piena (2 giocatori).' });
      return;
    }

    room.guest = { id: socket.id, name: playerName, deck };
    socket.join(roomId);
    console.log(`[PLAYER JOINED] ${playerName} joined Room ${roomId}`);

    // Notify host that guest connected
    io.to(room.host.id).emit('player_joined', {
      guest: room.guest
    });
  });

  // Sync initial game state from host to guest
  socket.on('sync_game_state', ({ roomId, gameState }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.gameState = gameState;
      socket.to(roomId).emit('game_state_synced', { gameState });
    }
  });

  // In-game actions (playing a card, attacking, ending turn)
  socket.on('game_action', ({ roomId, action, payload }) => {
    socket.to(roomId).emit('opponent_action', { action, payload });
  });

  // Disconnection cleanup
  socket.on('disconnect', () => {
    console.log(`[SOCKET DISCONNECTED] ID: ${socket.id}`);
    for (const [roomId, room] of rooms.entries()) {
      if (room.host?.id === socket.id || room.guest?.id === socket.id) {
        socket.to(roomId).emit('opponent_disconnected');
        rooms.delete(roomId);
        break;
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`=================================================`);
  console.log(`  CARD CLASH GAME & LAN SERVER ATTIVO!`);
  console.log(`  Indirizzo Locale (PC Host): http://${localIp}:${PORT}`);
  console.log(`=================================================`);
});
