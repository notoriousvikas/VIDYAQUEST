import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { env } from '../../../config/env';
import { calculateLevelFromXp } from '../services/xp.service';

describe('Gamification & Subject Map Module', () => {
  const app = createApp();

  const studentToken = jwt.sign(
    {
      sub: 'student-a-id',
      role: 'student',
      email: 'student.a@vidyaquest.edu',
      name: 'Student A',
    },
    env.AUTH_SECRET,
    { expiresIn: '1h' },
  );

  describe('calculateLevelFromXp', () => {
    it('starts at level 1 for 0 XP and levels up every 100 XP', () => {
      expect(calculateLevelFromXp(0)).toBe(1);
      expect(calculateLevelFromXp(99)).toBe(1);
      expect(calculateLevelFromXp(100)).toBe(2);
      expect(calculateLevelFromXp(250)).toBe(3);
    });

    it('clamps negative XP to level 1', () => {
      expect(calculateLevelFromXp(-50)).toBe(1);
    });
  });

  describe('API security, auth, and validation boundaries', () => {
    it('returns 200 on /health', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        status: 'ok',
        service: 'vidyaquest-backend',
      });
    });

    it('rejects unauthenticated access to student subjects and map routes', async () => {
      const [subjectsRes, mapRes, completeRes] = await Promise.all([
        request(app).get('/api/v1/student/subjects'),
        request(app).get('/api/v1/student/map'),
        request(app).post('/api/v1/student/map/missions/507f1f77bcf86cd799439011/complete'),
      ]);

      expect(subjectsRes.status).toBe(401);
      expect(mapRes.status).toBe(401);
      expect(completeRes.status).toBe(401);
    });

    it('rejects invalid JWT tokens with 401', async () => {
      const res = await request(app)
        .get('/api/v1/student/subjects')
        .set('Authorization', 'Bearer invalid.jwt.token');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_INVALID');
    });

    it('enforces teacher/admin role on admin map management endpoints', async () => {
      const res = await request(app)
        .post('/api/v1/admin/map/zones')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          mapId: '507f1f77bcf86cd799439011',
          name: 'Test Zone',
          slug: 'test-zone',
          positionX: 50,
          positionY: 50,
        });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('validates missionId ObjectId format before hitting service', async () => {
      const res = await request(app)
        .post('/api/v1/student/map/missions/not-an-object-id/complete')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ score: 100 });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
