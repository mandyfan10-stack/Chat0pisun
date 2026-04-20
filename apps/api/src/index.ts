import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from './config/db';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:8081'];

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] }
});

const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing.");
}

// Very basic in-memory chats for MVP demonstration
const chats: any[] = [];

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, username, displayName } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, username, displayName, passwordHash }
        });

        const accessToken = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '15m' });
        res.status(201).json({ accessToken, refreshToken: 'refresh_token', user: { id: user.id, username, displayName, email } });
    } catch(e) {
        res.status(400).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
        res.json({ accessToken, refreshToken: 'refresh_token', user: { id: user.id, username: user.username, displayName: user.displayName, email: user.email } });
    } catch(e) {
        res.status(400).json({ error: 'Login failed' });
    }
});

app.get('/api/users/search', async (req, res) => {
    const q = req.query.q as string;
    const results = await prisma.user.findMany({
        where: { OR: [{ username: { contains: q } }, { displayName: { contains: q } }] },
        select: { id: true, username: true, displayName: true }
    });
    res.json(results);
});

app.post('/api/chats', async (req, res) => {
    const { targetUserId } = req.body;
    // Note: Mocking auth for demo
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }});
    const chat = { id: String(Date.now()), participants: [{userId: 'current', user: null}, {userId: targetUserId, user: targetUser}], messages: [] };
    chats.push(chat);
    res.status(201).json(chat);
});

app.get('/api/chats', (req, res) => {
    res.json(chats);
});

app.get('/health', async (req, res) => {
  res.json({ status: 'ok' });
});

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
