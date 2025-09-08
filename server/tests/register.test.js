import request from 'supertest';
import app from '../server/index.js';

describe('Suite de pruebas VitaCard365', () => {
  let tokenZIS, tokenNormal;
  const folioZIS = 'VITAZIS ABCD1234';
  const emailZIS = 'qa+zis@vita.test';
  const emailNormal = 'qa+normal@vita.test';

  it('Registro con folio ZIS → 200, PAID, id_vita ^VITAZIS [A-Z0-9]{8}$, sin fila en subscriptions', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: emailZIS, name: 'QA ZIS', kvCode: folioZIS });
    expect(res.statusCode).toBe(201);
    expect(res.body.entitlements).toBe('PAID');
    expect(res.body.id_vita).toMatch(/^VITAZIS [A-Z0-9]{8}$/);
    tokenZIS = res.body.token;
    // TODO: Verificar que no se crea fila en subscriptions
  });

  it('Reuso del mismo folio → 409 USED_CODE', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'qa+zis2@vita.test', name: 'QA ZIS2', kvCode: folioZIS });
    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('USED_CODE');
  });

  it('Registro normal → NONE y acceso denegado a endpoints con requirePaid (403)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: emailNormal, name: 'QA Normal' });
    expect(res.statusCode).toBe(201);
    expect(res.body.entitlements).toBe('NONE');
    tokenNormal = res.body.token;
    // Prueba acceso a endpoint protegido
    const res2 = await request(app)
      .post('/profile/certificate')
      .set('Authorization', `Bearer ${tokenNormal}`)
      .send({});
    expect(res2.statusCode).toBe(403);
    expect(res2.body.code).toBe('PAYWALL');
  });

  it('Intento de crear suscripción con usuario PAID por ZIS/KV/Enterprise → 409 ALREADY_PAID', async () => {
    const res = await request(app)
      .post('/api/billing/subscriptions')
      .set('Authorization', `Bearer ${tokenZIS}`)
      .send({ planId: 1 });
    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('ALREADY_PAID');
  });

  it('Refresh de JWT mantiene claims correctos (entitlements, id_vita)', async () => {
    // Simula refresh
    const res = await request(app)
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${tokenZIS}`)
      .send({});
    expect(res.statusCode).toBe(200);
    expect(res.body.entitlements).toBe('PAID');
    expect(res.body.id_vita).toMatch(/^VITAZIS [A-Z0-9]{8}$/);
  });
});
