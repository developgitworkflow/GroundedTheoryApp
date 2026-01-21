import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suggestCodes, generateTheoreticalMemo } from './geminiService';
import { GoogleGenAI } from "@google/genai";

// Mock the GoogleGenAI library
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn(),
    Type: {
      OBJECT: 'OBJECT',
      ARRAY: 'ARRAY',
      STRING: 'STRING'
    }
  };
});

describe('geminiService', () => {
  const mockGenerateContent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup the mock instance
    (GoogleGenAI as any).mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    }));
    process.env.API_KEY = 'test-api-key';
  });

  describe('suggestCodes', () => {
    it('should return codes when API returns valid JSON', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ codes: ['Code 1', 'Code 2'] })
      });

      const result = await suggestCodes('some text context');
      
      expect(result).toEqual(['Code 1', 'Code 2']);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview',
        contents: expect.stringContaining('some text context')
      }));
    });

    it('should return empty array if API response is invalid JSON', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Not JSON'
      });

      const result = await suggestCodes('text');
      expect(result).toEqual([]);
    });

    it('should return empty array if API throws error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await suggestCodes('text');
      expect(result).toEqual([]);
    });
  });

  describe('generateTheoreticalMemo', () => {
    it('should return memo text', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Generated memo content.'
      });

      const result = await generateTheoreticalMemo(['Code A'], 'Context');
      expect(result).toBe('Generated memo content.');
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-pro-preview',
        contents: expect.stringContaining('Code A')
      }));
    });

    it('should return fallback message on error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Fail'));

      const result = await generateTheoreticalMemo([], '');
      expect(result).toBe('Failed to generate memo.');
    });
  });
});
