import request from 'supertest';
import { buildContainer } from '../../../config/container.js';
import { buildApp } from '../app.js';
import { clearAllCollections, startInMemoryMongo, stopInMemoryMongo } from '../../../test/mongo.js';

// End-to-end test of the full HTTP stack against a real in-memory Mongo.
// Verifies routing, validation, auth, persistence, and the use-case wiring
// all line up. If this passes, the production happy-path is reachable.
describe('HTTP integration', () => {
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    await startInMemoryMongo();
    app = buildApp(buildContainer());
  });
  afterAll(async () => {
    await stopInMemoryMongo();
  });
  beforeEach(async () => {
    await clearAllCollections();
  });

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('register → login → create board → create task → fetch board', async () => {
    // Register
    const reg = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      password: 'goodpass1',
      name: 'Alice',
    });
    expect(reg.status).toBe(201);
    const { accessToken } = reg.body;
    expect(accessToken).toBeTruthy();

    // Create board
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Demo' });
    expect(boardRes.status).toBe(201);
    const boardId = boardRes.body.id;

    // Create task
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ boardId, title: 'First task' });
    expect(taskRes.status).toBe(201);
    expect(taskRes.body.title).toBe('First task');

    // Fetch board with tasks
    const fetched = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.tasks).toHaveLength(1);
  });

  it('rejects requests without bearer token', async () => {
    const res = await request(app).get('/api/boards');
    expect(res.status).toBe(401);
  });

  it('returns 400 on validation failure', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('AI parse-task returns a draft using mock provider', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'bob@example.com',
      password: 'goodpass1',
      name: 'Bob',
    });
    const token = reg.body.accessToken;
    const board = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'AI demo' });
    const ai = await request(app)
      .post('/api/ai/parse-task')
      .set('Authorization', `Bearer ${token}`)
      .send({ boardId: board.body.id, text: 'urgent: ship docs by tomorrow' });
    expect(ai.status).toBe(200);
    expect(ai.body.priority).toBe('urgent');
    expect(ai.body.confidence).toBeGreaterThanOrEqual(0);
  });
});
