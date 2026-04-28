import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/db';

const password = 'password123';

const registerUser = (suffix: string, overrides: Record<string, unknown> = {}) => {
  return request(app)
    .post('/api/auth/register')
    .send({
      email: `${suffix}@example.com`,
      username: suffix,
      displayName: `User ${suffix}`,
      password,
      ...overrides,
    });
};

const createAuthUser = async (suffix: string) => {
  const response = await registerUser(suffix).expect(201);

  return {
    user: response.body.user,
    accessToken: response.body.accessToken as string,
    refreshToken: response.body.refreshToken as string,
  };
};

const authHeader = (token: string) => `Bearer ${token}`;

beforeEach(async () => {
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.chatParticipant.deleteMany(),
    prisma.chat.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('auth endpoints', () => {
  it('registers a new user with normalized credentials and safe DTOs', async () => {
    const response = await registerUser('Alice_User', {
      email: 'ALICE@EXAMPLE.COM',
      username: 'Alice_User',
    }).expect(201);

    expect(response.body.user).toMatchObject({
      email: 'alice@example.com',
      username: 'alice_user',
      displayName: 'User Alice_User',
    });
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).not.toBe('refresh_token');
  });

  it('rejects duplicate email and username', async () => {
    await registerUser('duplicate').expect(201);

    const duplicateEmail = await registerUser('other', {
      email: 'duplicate@example.com',
    }).expect(409);
    expect(duplicateEmail.body.error.code).toBe('EMAIL_TAKEN');

    const duplicateUsername = await registerUser('duplicate', {
      email: 'new@example.com',
    }).expect(409);
    expect(duplicateUsername.body.error.code).toBe('USERNAME_TAKEN');
  });

  it('logs in with valid credentials and rejects invalid credentials', async () => {
    await registerUser('loginuser').expect(201);

    const success = await request(app)
      .post('/api/auth/login')
      .send({ email: 'loginuser@example.com', password })
      .expect(200);

    expect(success.body.user.username).toBe('loginuser');
    expect(success.body.accessToken).toEqual(expect.any(String));

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'loginuser@example.com', password: 'wrong-password' })
      .expect(401);
  });

  it('returns the current user from /auth/me', async () => {
    const auth = await createAuthUser('meuser');

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', authHeader(auth.accessToken))
      .expect(200);

    expect(response.body.user).toMatchObject({
      id: auth.user.id,
      username: 'meuser',
      email: 'meuser@example.com',
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('rotates refresh tokens', async () => {
    const auth = await createAuthUser('refreshuser');

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: auth.refreshToken })
      .expect(200);

    expect(refreshed.body.refreshToken).toEqual(expect.any(String));
    expect(refreshed.body.refreshToken).not.toBe(auth.refreshToken);

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: auth.refreshToken })
      .expect(401);

    await request(app)
      .get('/api/auth/me')
      .set('Authorization', authHeader(refreshed.body.accessToken))
      .expect(200);
  });

  it('revokes sessions on logout', async () => {
    const auth = await createAuthUser('logoutuser');

    await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: auth.refreshToken })
      .expect(204);

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: auth.refreshToken })
      .expect(401);
  });
});

describe('users, chats, and messages', () => {
  it('requires auth for user search and returns limited safe DTOs', async () => {
    const current = await createAuthUser('searcher');

    await request(app).get('/api/users/search?q=al').expect(401);

    for (let index = 0; index < 12; index += 1) {
      await registerUser(`alex_${index}`).expect(201);
    }

    const response = await request(app)
      .get('/api/users/search?q=al')
      .set('Authorization', authHeader(current.accessToken))
      .expect(200);

    expect(response.body).toHaveLength(10);
    expect(response.body.every((user: { passwordHash?: string }) => user.passwordHash === undefined)).toBe(true);
    expect(response.body.some((user: { id: string }) => user.id === current.user.id)).toBe(false);
  });

  it('requires auth to create chats and never uses a hardcoded current user', async () => {
    const alice = await createAuthUser('alice');
    const bob = await createAuthUser('bob');

    await request(app).post('/api/chats').send({ targetUserId: bob.user.id }).expect(401);

    const response = await request(app)
      .post('/api/chats')
      .set('Authorization', authHeader(alice.accessToken))
      .send({ targetUserId: bob.user.id })
      .expect(201);

    const participantIds = response.body.participants.map((participant: { userId: string }) => participant.userId);
    expect(participantIds).toEqual(expect.arrayContaining([alice.user.id, bob.user.id]));
    expect(participantIds).not.toContain('current');
  });

  it('lists only chats where the current user is a participant', async () => {
    const alice = await createAuthUser('alice');
    const bob = await createAuthUser('bob');
    const carol = await createAuthUser('carol');

    const aliceChat = await request(app)
      .post('/api/chats')
      .set('Authorization', authHeader(alice.accessToken))
      .send({ targetUserId: bob.user.id })
      .expect(201);

    await request(app)
      .post('/api/chats')
      .set('Authorization', authHeader(bob.accessToken))
      .send({ targetUserId: carol.user.id })
      .expect(201);

    const response = await request(app)
      .get('/api/chats')
      .set('Authorization', authHeader(alice.accessToken))
      .expect(200);

    expect(response.body.map((chat: { id: string }) => chat.id)).toEqual([aliceChat.body.id]);
  });

  it('prevents non-participants from reading or writing messages', async () => {
    const alice = await createAuthUser('alice');
    const bob = await createAuthUser('bob');
    const carol = await createAuthUser('carol');

    const chat = await request(app)
      .post('/api/chats')
      .set('Authorization', authHeader(alice.accessToken))
      .send({ targetUserId: bob.user.id })
      .expect(201);

    await request(app)
      .get(`/api/chats/${chat.body.id}/messages`)
      .set('Authorization', authHeader(carol.accessToken))
      .expect(403);

    await request(app)
      .post(`/api/chats/${chat.body.id}/messages`)
      .set('Authorization', authHeader(carol.accessToken))
      .send({ text: 'I should not be here' })
      .expect(403);

    await request(app)
      .get(`/api/chats/${chat.body.id}/messages`)
      .set('Authorization', authHeader(alice.accessToken))
      .expect(200, []);
  });

  it('persists created messages and exposes them as chat last messages', async () => {
    const alice = await createAuthUser('alice');
    const bob = await createAuthUser('bob');

    const chat = await request(app)
      .post('/api/chats')
      .set('Authorization', authHeader(alice.accessToken))
      .send({ targetUserId: bob.user.id })
      .expect(201);

    const created = await request(app)
      .post(`/api/chats/${chat.body.id}/messages`)
      .set('Authorization', authHeader(alice.accessToken))
      .send({ text: 'Hello Bob' })
      .expect(201);

    expect(created.body).toMatchObject({
      chatId: chat.body.id,
      senderId: alice.user.id,
      text: 'Hello Bob',
    });

    const messages = await request(app)
      .get(`/api/chats/${chat.body.id}/messages`)
      .set('Authorization', authHeader(bob.accessToken))
      .expect(200);

    expect(messages.body[0]).toMatchObject({ id: created.body.id, text: 'Hello Bob' });

    const chats = await request(app)
      .get('/api/chats')
      .set('Authorization', authHeader(bob.accessToken))
      .expect(200);

    expect(chats.body[0].lastMessage).toMatchObject({ id: created.body.id, text: 'Hello Bob' });
  });
});
