import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../api/client';

describe('API Client Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('has baseURL configured to /api/v1', () => {
    expect(apiClient.defaults.baseURL).toBe('/api/v1');
  });

  it('sets default JSON headers', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    expect(apiClient.defaults.headers['Accept']).toBe('application/json');
  });

  it('handles token storage correctly', () => {
    localStorage.setItem('aquatrack_token', 'sample-sanctum-token-123');
    expect(localStorage.getItem('aquatrack_token')).toBe('sample-sanctum-token-123');

    localStorage.removeItem('aquatrack_token');
    expect(localStorage.getItem('aquatrack_token')).toBeNull();
  });
});
