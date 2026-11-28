import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { env } from '../../../config/env';

describe('Student Dashboard, Avatar & Profile API', () => {
  const app = createApp();

  const studentToken = jwt.sign(
    {
      sub: 'student-dash-test-id',
      role: 'student',
      email: 'aarav@vidyaquest.edu',
      name: 'Aarav',
    },
    env.AUTH_SECRET,
    { expiresIn: '1h' },
  );

  it('rejects unauthenticated access to dashboard, avatar, and profile endpoints', async () => {
    const [dashRes, avatarRes, itemsRes, profileRes, achRes, actRes] = await Promise.all([
      request(app).get('/api/v1/student/dashboard'),
      request(app).get('/api/v1/student/avatar'),
      request(app).get('/api/v1/student/avatar/items'),
      request(app).patch('/api/v1/student/profile').send({ displayName: 'Test' }),
      request(app).get('/api/v1/student/achievements'),
      request(app).get('/api/v1/student/activity'),
    ]);

    expect(dashRes.status).toBe(401);
    expect(avatarRes.status).toBe(401);
    expect(itemsRes.status).toBe(401);
    expect(profileRes.status).toBe(401);
    expect(achRes.status).toBe(401);
    expect(actRes.status).toBe(401);
  });

  it('validates empty PATCH /api/v1/student/avatar payload with 400', async () => {
    const res = await request(app)
      .patch('/api/v1/student/avatar')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('validates invalid displayName on PATCH /api/v1/student/profile with 400', async () => {
    const res = await request(app)
      .patch('/api/v1/student/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ displayName: 'A' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
