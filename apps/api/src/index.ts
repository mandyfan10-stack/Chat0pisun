import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Very basic in-memory DB for MVP demonstration of the flow without Prisma setup blocks
const users: any[] = [];
const chats: any[] = [];

app.use(helmet());
app.use(cors());
app.use(express.json());

app.post('/api/auth/register', async (req, res) => {
    const { email, password, username, displayName } = req.body;
    if (users.find(u => u.email === email || u.username === username)) {
        return res.status(400).json({ error: 'User exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id: String(Date.now()), email, username, displayName, passwordHash };
    users.push(user);

    const accessToken = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).json({ accessToken, refreshToken: 'refresh_token', user: { id: user.id, username, displayName, email } });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }
    const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken, refreshToken: 'refresh_token', user: { id: user.id, username: user.username, displayName: user.displayName, email: user.email } });
});

app.get('/api/users/search', (req, res) => {
    const q = req.query.q as string;
    const results = users.filter(u => u.username.includes(q) || u.displayName.includes(q)).map(u => ({ id: u.id, username: u.username, displayName: u.displayName }));
    res.json(results);
});

app.post('/api/chats', (req, res) => {
    const { targetUserId } = req.body;
    // Mock user from token decode usually here
    const chat = { id: String(Date.now()), participants: [{userId: req.body.userId || 'current', user: users.find(u => u.id === req.body.userId)}, {userId: targetUserId, user: users.find(u => u.id === targetUserId)}], messages: [] };
    chats.push(chat);
    res.status(201).json(chat);
});

app.get('/health', async (req, res) => {
  res.json({ status: 'ok' });
});

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
