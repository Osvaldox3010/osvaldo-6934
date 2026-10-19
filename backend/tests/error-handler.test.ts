import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler, getErrorType } from '../src/middlewares/error-handler';

function buildAppThatFailsWith(error: unknown) {
    const app = express();

    app.get('/fail', () => {
        throw error;
    });

    app.use(errorHandler);

    return app;
}

describe('getErrorType', () => {
    it('devuelve el tipo cuando el error tiene un campo type de texto', () => {
        expect(getErrorType({ type: 'entity.too.large' })).toBe('entity.too.large');
    });

    it('devuelve null cuando el error no tiene campo type', () => {
        expect(getErrorType(new Error('fallo'))).toBeNull();
    });

    it('devuelve null cuando el campo type no es texto', () => {
        expect(getErrorType({ type: 5 })).toBeNull();
    });

    it('devuelve null cuando el error es un texto', () => {
        expect(getErrorType('fallo')).toBeNull();
    });

    it('devuelve null cuando el error es null', () => {
        expect(getErrorType(null)).toBeNull();
    });

    it('devuelve null cuando el error es undefined', () => {
        expect(getErrorType(undefined)).toBeNull();
    });
});

describe('errorHandler', () => {
    it('responde 400 y invalid_request cuando el JSON está mal escrito', async () => {
        const error = Object.assign(new Error('fallo'), { type: 'entity.parse.failed' });
        const response = await request(buildAppThatFailsWith(error)).get('/fail');

        expect(response.status).toBe(400);
        expect(response.body.status_detail).toBe('invalid_request');
    });

    it('responde 400 y invalid_request cuando el cuerpo es demasiado grande', async () => {
        const error = Object.assign(new Error('fallo'), { type: 'entity.too.large' });
        const response = await request(buildAppThatFailsWith(error)).get('/fail');

        expect(response.status).toBe(400);
        expect(response.body.status_detail).toBe('invalid_request');
    });

    it('responde 503 y service_unavailable ante un error inesperado', async () => {
        const response = await request(buildAppThatFailsWith(new Error('fallo'))).get('/fail');

        expect(response.status).toBe(503);
        expect(response.body.status).toBe('error');
        expect(response.body.status_detail).toBe('service_unavailable');
        expect(response.body.authorization_code).toBeNull();
        expect(Object.keys(response.body)).toHaveLength(11);
    });

    it('responde 503 y service_unavailable ante un tipo de error desconocido', async () => {
        const error = Object.assign(new Error('fallo'), { type: 'otro.tipo' });
        const response = await request(buildAppThatFailsWith(error)).get('/fail');

        expect(response.status).toBe(503);
        expect(response.body.status_detail).toBe('service_unavailable');
    });
});
