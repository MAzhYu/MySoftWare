const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load env
dotenv.config();

// DB connection
const { connectDB } = require('./config/database.mysql');
require('./models/User.mysql');
require('./models/WrongProblem.mysql');
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use('/api/auth', require('./routes/auth.en'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/ai', require('./routes/ai'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service healthy',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource ${req.originalUrl} not found`
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : {}
  });
});

// =================== Socket.IO逻辑 ===================
const rooms = {}; // { roomCode: { players: [], scores: {}, finished: {}, finalized: false, timer: null } }

io.on('connection', (socket) => {
  console.log(`🔗 Client connected: ${socket.id}`);
  const cleanUpDelay = 60000; // 60s

  // 创建房间
socket.on('createRoom', (data = {}) => {
  const roomCode = Math.floor(100000 + Math.random() * 900000).toString()
  rooms[roomCode] = {
    players: [
      {
        id: socket.id,
        name: data.name || '房主',
        avatar: data.avatar || '/static/icons/student.png',
        ready: false
      }
    ],
    scores: {},
    finished: {},
    finalized: false,
    timer: null,
    config: {
      questionCount: data.questionCount || 10,
      type: data.type || '混合运算',
      timeLimit: data.timeLimit || 30,
      seed: data.seed || Math.floor(Math.random() * 1000000)
    }
  }

  socket.join(roomCode)
  socket.emit('roomCreated', {
    roomCode,
    config: rooms[roomCode].config,
    players: rooms[roomCode].players
  })
});
socket.on('joinRoom', (roomCode, playerData = {}) => {
  const room = rooms[roomCode]
  if (room && room.players.length < 2) {
    room.players.push({
      id: socket.id,
      name: playerData.name || '加入者',
      avatar: playerData.avatar || '/static/icons/robot.png',
      ready: false
    })
    socket.join(roomCode)

    io.to(roomCode).emit('playerJoined', {
      config: room.config,
      players: room.players
    })
  } else {
    socket.emit('roomFullOrNotExist')
  }
});

  // 玩家准备
  socket.on('playerReady', (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.readyCount = (room.readyCount || 0) + 1;
    socket.to(roomCode).emit('otherReady');

    if (room.readyCount >= 2) {
      room.readyCount = 0;
      room.scores = {};
      room.finished = {};
      room.finalized = false;

      io.to(roomCode).emit('startPK');
      console.log(`🚀 PK started in room ${roomCode}`);

      // 启动全局倒计时（30秒后兜底结算）
      // 启动全局倒计时，根据房间配置 timeLimit 动态设置
const limit = (room.config?.timeLimit || 30) * 1000;
clearTimeout(room.timer);
room.timer = setTimeout(() => finalizeRoom(roomCode), limit);

    }
  });

  // 进入对战阶段
  socket.on('joinComp', (roomCode) => {
    socket.join(roomCode);
    const room = rooms[roomCode];
    if (room) {
      if (!room.players.includes(socket.id)) {
        if (room.players.length < 2) room.players.push(socket.id);
        else {
          const memberSet = io.sockets.adapter.rooms.get(roomCode) || new Set();
          for (let i = 0; i < room.players.length; i++) {
            if (!memberSet.has(room.players[i])) {
              room.players[i] = socket.id;
              break;
            }
          }
        }
      }
    }
    console.log(`⚔️ Player entered comp room ${roomCode} as ${socket.id}`);
  });

  // 同步分数
  socket.on('updateScore', (data) => {
  const { roomCode, score } = data;
  const room = rooms[roomCode];
  if (!room) return;

  // ✅ 保存当前玩家分数
  room.scores[socket.id] = score;

  // ✅ 通知对方刷新分数
  socket.to(roomCode).emit('updateScore', score);
});


  // 玩家完成
  socket.on('playerFinished', (data) => {
    const { roomCode, score } = data;
    const room = rooms[roomCode];
    if (!room) return;

    room.scores[socket.id] = score;
    room.finished[socket.id] = true;
    console.log(`⚡ Player finished in room ${roomCode}`);

    // ✅ 双方都完成才立即结算
    const finishedCount = Object.keys(room.finished).length;
    if (!room.finalized && finishedCount >= 2) {
      finalizeRoom(roomCode);
    }
  });

  // 再战逻辑
  socket.on('inviteRematch', (roomCode) => {
    socket.to(roomCode).emit('receiveRematchInvite');
  });

socket.on('acceptRematch', (roomCode) => {
  const room = rooms[roomCode];
  if (!room) return;

  // 重置状态
  room.scores = {};
  room.finished = {};
  room.finalized = false;
  clearTimeout(room.timer);

  io.to(roomCode).emit('startRematch');
  console.log(`🔁 Room ${roomCode} rematch started`);
});


  socket.on('declineRematch', (roomCode) => {
    socket.to(roomCode).emit('rematchDeclined');
  });

  // 断线处理
  socket.on('disconnect', () => {
    for (const [roomCode, room] of Object.entries(rooms)) {
      if (room.players.includes(socket.id)) {
        io.to(roomCode).emit('playerLeft', { socketId: socket.id });
        room.players = room.players.filter(id => id !== socket.id);
        room._lastDisconnectAt = Date.now();

        clearTimeout(room._cleanupTimer);
        room._cleanupTimer = setTimeout(() => {
          const active = io.sockets.adapter.rooms.get(roomCode);
          if (!active || active.size === 0) {
            delete rooms[roomCode];
            console.log(`🧹 Room ${roomCode} cleaned up`);
          }
        }, cleanUpDelay);
        break;
      }
    }
  });

  // 结算函数
  function finalizeRoom(roomCode) {
    const room = rooms[roomCode];
    if (!room || room.finalized) return;
    room.finalized = true;
    clearTimeout(room.timer);

    const [p1, p2] = room.players;
    if (!p1 || !p2) return;

    const s1 = room.scores[p1] || 0;
    const s2 = room.scores[p2] || 0;

    let result1, result2;
    if (s1 > s2) {
      result1 = '🎉 You win!';
      result2 = '😢 You lose!';
    } else if (s1 < s2) {
      result1 = '😢 You lose!';
      result2 = '🎉 You win!';
    } else {
      result1 = result2 = '🤝 Draw!';
    }

    const memberSet = io.sockets.adapter.rooms.get(roomCode) || new Set();
    if (p1 && memberSet.has(p1))
      io.to(p1).emit('finalResult', { myScore: s1, otherScore: s2, result: result1 });
    if (p2 && memberSet.has(p2))
      io.to(p2).emit('finalResult', { myScore: s2, otherScore: s1, result: result2 });

    io.to(roomCode).emit('finalResultBroadcast', {
      players: [
        { socketId: p1, score: s1 },
        { socketId: p2, score: s2 }
      ],
      draw: s1 === s2
    });

    console.log(`🏁 Room ${roomCode} ended: ${s1} vs ${s2}`);
  }
});

// 启动服务
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

module.exports = { app, server };
