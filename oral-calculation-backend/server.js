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

// --- Create HTTP server & attach socket.io ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // or specify your UniApp dev server origin
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure UTF-8 JSON responses
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth.en'));
app.use('/api/problems', require('./routes/problems')); // math problems
app.use('/api/ai', require('./routes/ai')); // AI assistant

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Service healthy',
        services: {
            auth: 'ok',
            problems: 'ok',
            database: 'ok'
        },
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Resource ${req.originalUrl} not found`
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
});

// --- Socket.IO 房间逻辑 ---
const rooms = {}; // { roomCode: { players: [], readyCount: 0 } }

io.on('connection', (socket) => {
    console.log(`🔗 Client connected: ${socket.id}`);

    // 房主创建房间
    socket.on('createRoom', (data) => {
        const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        rooms[roomCode] = {
            players: [socket.id],
            readyCount: 0
        };
        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode });
        console.log(`🏠 Room created: ${roomCode}`);
    });

    // 玩家加入房间
    socket.on('joinRoom', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.players.length < 2) {
            room.players.push(socket.id);
            socket.join(roomCode);
            io.to(roomCode).emit('playerJoined');
            console.log(`👥 Player joined room ${roomCode}`);
        } else {
            socket.emit('roomFullOrNotExist');
        }
    });

    // 玩家点击准备
    socket.on('playerReady', (roomCode) => {
        const room = rooms[roomCode];
        if (!room) return;

        room.readyCount++;
        socket.to(roomCode).emit('otherReady');

        if (room.readyCount >= 2) {
            io.to(roomCode).emit('startPK');
            room.readyCount = 0; // reset for next match
        }
    });

    // 断开连接
    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
        for (const [roomCode, room] of Object.entries(rooms)) {
            if (room.players.includes(socket.id)) {
                io.to(roomCode).emit('playerLeft');
                delete rooms[roomCode];
                break;
            }
        }
    });
    // 比赛阶段：实时同步得分
    socket.on('joinComp', (roomCode) => {
        socket.join(roomCode);
        console.log(`⚔️ Player entered comp room ${roomCode}`);
    });

    socket.on('updateScore', (data) => {
        socket.to(data.roomCode).emit('updateScore', data.score);
    });

    socket.on('endPK', (result) => {
        socket.to([...socket.rooms][1]).emit('endPK', result);
    });
// 再战邀请
    socket.on('inviteRematch', (roomCode) => {
        socket.to(roomCode).emit('receiveRematchInvite');
    });

// 接受再战
    socket.on('acceptRematch', (roomCode) => {
        io.to(roomCode).emit('rematchAccepted');
    });

// 拒绝再战
    socket.on('declineRematch', (roomCode) => {
        socket.to(roomCode).emit('rematchDeclined');
    });


});

// --- 启动服务 ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}, env: ${process.env.NODE_ENV}`);
});

module.exports = { app, server };
