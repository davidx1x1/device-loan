// Unit tests for logging utilities
import { describe, it, expect } from '@jest/globals';
import { generateCorrelationId } from '../logger';

describe('Logger Utilities', () => {
  describe('generateCorrelationId', () => {
    it('should generate a valid UUID', () => {
      const correlationId = generateCorrelationId();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(correlationId)).toBe(true);
    });

    it('should generate unique IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
    });
  });
});
