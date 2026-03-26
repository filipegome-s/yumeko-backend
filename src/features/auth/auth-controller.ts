import type { FastifyInstance } from 'fastify';
import { match } from 'ts-pattern';
import { getCurrentUser } from './get-current-user';
import { getDiscordAuthUrl } from './get-discord-auth-url';
import { handleDiscordCallback } from './handle-discord-callback';
import { logout } from './logout';
import { logoutAll } from './logout-all';
import { refreshToken } from './refresh-token';

export default async function authController(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/api/v1/auth/discord',
    schema: {
      summary: 'Get Discord OAuth URL',
      tags: ['auth'],
      response: {
        200: {
          description: 'Discord OAuth URL',
          type: 'object',
          properties: {
            url: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      const result = await getDiscordAuthUrl({}, fastify.dependencies);

      return match(result)
        .with({ type: 'success' }, ({ url }) => reply.status(200).send({ url }))
        .exhaustive();
    },
  });

  fastify.route<{ Querystring: { code: string } }>({
    method: 'GET',
    url: '/api/v1/auth/discord/callback',
    schema: {
      summary: 'Handle Discord OAuth callback',
      tags: ['auth'],
      querystring: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' },
        },
      },
      response: {
        302: {
          description: 'Redirect to frontend with session cookie',
        },
        400: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await handleDiscordCallback({ code: request.query.code }, fastify.dependencies);

      return match(result)
        .with({ type: 'success' }, ({ sessionId }) => {
          reply.setCookie('session_id', sessionId, {
            httpOnly: true,
            secure: fastify.dependencies.config.env === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
          });
          return reply.redirect('/');
        })
        .with({ type: 'invalid_code' }, () =>
          reply.status(400).send({ message: 'Invalid authorization code', statusCode: 400 }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });

  fastify.route({
    method: 'POST',
    url: '/api/v1/auth/logout',
    schema: {
      summary: 'Logout',
      tags: ['auth'],
      response: {
        200: {
          description: 'Logged out successfully',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        401: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const sessionId = request.cookies['session_id'];

      if (!sessionId) {
        return reply.status(401).send({ message: 'Not authenticated', statusCode: 401 });
      }

      await logout({ sessionId }, fastify.dependencies);

      reply.clearCookie('session_id', { path: '/' });

      return reply.status(200).send({ message: 'Logged out successfully' });
    },
  });

  fastify.route({
    method: 'GET',
    url: '/api/v1/auth/me',
    schema: {
      summary: 'Get current user',
      tags: ['auth'],
      response: {
        200: {
          description: 'Current user',
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            avatar: { type: 'string', nullable: true },
          },
        },
        401: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const sessionId = request.cookies['session_id'];

      if (!sessionId) {
        return reply.status(401).send({ message: 'Not authenticated', statusCode: 401 });
      }

      const result = await getCurrentUser({ sessionId }, fastify.dependencies);

      return match(result)
        .with({ type: 'success' }, ({ user }) => reply.status(200).send(user))
        .with({ type: 'not_found' }, () => reply.status(404).send({ message: 'User not found', statusCode: 404 }))
        .with({ type: 'expired' }, () => {
          reply.clearCookie('session_id', { path: '/' });
          return reply.status(401).send({ message: 'Session expired', statusCode: 401 });
        })
        .exhaustive();
    },
  });

  fastify.route({
    method: 'POST',
    url: '/api/v1/auth/refresh',
    schema: {
      summary: 'Refresh session token',
      description: 'Refresh Discord access token',
      tags: ['auth'],
      response: {
        200: {
          description: 'Token refreshed successfully',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        401: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const sessionId = request.cookies['session_id'];

      if (!sessionId) {
        return reply.status(401).send({ message: 'Not authenticated', statusCode: 401 });
      }

      const result = await refreshToken({ sessionId }, fastify.dependencies);

      return match(result)
        .with({ type: 'success' }, () => reply.status(200).send({ message: 'Token refreshed' }))
        .with({ type: 'not_found' }, () => {
          reply.clearCookie('session_id', { path: '/' });
          return reply.status(401).send({ message: 'Session not found', statusCode: 401 });
        })
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Failed to refresh token', statusCode: 500 }))
        .exhaustive();
    },
  });

  fastify.route({
    method: 'POST',
    url: '/api/v1/auth/logout-all',
    schema: {
      summary: 'Logout from all devices',
      tags: ['auth'],
      response: {
        200: {
          description: 'Logged out from all devices',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        401: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const sessionId = request.cookies['session_id'];

      if (!sessionId) {
        return reply.status(401).send({ message: 'Not authenticated', statusCode: 401 });
      }

      const session = await fastify.dependencies.repositories.sessionsRepository.getById(sessionId);

      if (!session) {
        reply.clearCookie('session_id', { path: '/' });
        return reply.status(401).send({ message: 'Session not found', statusCode: 401 });
      }

      await logoutAll({ userId: session.userId }, fastify.dependencies);

      reply.clearCookie('session_id', { path: '/' });

      return reply.status(200).send({ message: 'Logged out from all devices' });
    },
  });
}
