/**
 * API Client Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '@/lib/api/client';
import { AuthenticationError, NotFoundError, ValidationError, TimeoutError } from '@/lib/api/errors';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('http://localhost:5000', 30000);
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('makes GET request with correct headers', async () => {
      const mockData = { id: '1', name: 'Test' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const response = await client.get('/test');

      expect(response.data).toEqual(mockData);
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('includes auth token when set', async () => {
      const mockData = { data: 'test' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      client.setAuthToken('test-token');
      await client.get('/test');

      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer test-token');
    });
  });

  describe('POST requests', () => {
    it('makes POST request with body', async () => {
      const mockData = { id: '1' };
      const postBody = { name: 'Test' };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockData,
      });

      const response = await client.post('/test', postBody);

      expect(response.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postBody),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('throws AuthenticationError on 401', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(client.get('/test')).rejects.toThrow(AuthenticationError);
    });

    it('throws NotFoundError on 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Resource not found' }),
      });

      await expect(client.get('/test')).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError on 400', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Validation failed' }),
      });

      await expect(client.post('/test', {})).rejects.toThrow(ValidationError);
    });

    it('throws TimeoutError on timeout', async () => {
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
        })
      );

      const shortTimeoutClient = new ApiClient('http://localhost:5000', 50);
      await expect(shortTimeoutClient.get('/test')).rejects.toThrow(TimeoutError);
    });
  });

  describe('Token management', () => {
    it('sets and gets auth token', () => {
      expect(client.getAuthToken()).toBeNull();
      
      client.setAuthToken('test-token');
      expect(client.getAuthToken()).toBe('test-token');
      
      client.setAuthToken(null);
      expect(client.getAuthToken()).toBeNull();
    });
  });
});
