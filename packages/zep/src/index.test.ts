/**
 * Tests for DeepaData Zep Adapter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  queryBySignificance,
  feedback,
  activate,
} from "./index.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Zep Adapter", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Clear env
    delete process.env.DEEPADATA_API_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("queryBySignificance", () => {
    it("returns ActivateResult with correct shape", async () => {
      // SDK expects response wrapped in { data: { ... } }
      const mockResponse = {
        data: {
          activation_id: "test-activation-123",
          arc_types: ["growth", "healing"],
          primary_domain: "Gravity",
          field_filters: {
            emotional_weight: { gte: 0.7 },
            tether_type: { in: ["familial", "friendship"] },
          },
          confidence: 0.85,
          significance_gate: true,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await queryBySignificance({
        query: "when was I happiest with mum",
        apiKey: "test-api-key",
      });

      expect(result).toHaveProperty("arcTypes");
      expect(result).toHaveProperty("primaryDomain");
      expect(result).toHaveProperty("fieldFilters");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("significanceGate");
      expect(Array.isArray(result.arcTypes)).toBe(true);
      expect(typeof result.confidence).toBe("number");
      expect(typeof result.significanceGate).toBe("boolean");
    });

    it("throws if no API key provided", async () => {
      await expect(
        queryBySignificance({
          query: "test query",
        })
      ).rejects.toThrow();
    });

    it("returns significanceGate: false for empty query", async () => {
      const mockResponse = {
        data: {
          activation_id: null,
          arc_types: [],
          primary_domain: null,
          field_filters: {},
          confidence: 0,
          significance_gate: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await queryBySignificance({
        query: "",
        apiKey: "test-api-key",
      });

      expect(result.significanceGate).toBe(false);
    });
  });

  describe("feedback", () => {
    it("accepts correct input shape without throwing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // feedback should not throw with valid input
      await expect(
        feedback({
          activationId: "test-activation-id",
          hit: true,
          apiKey: "test-api-key",
        })
      ).resolves.not.toThrow();
    });
  });

  describe("activate re-export", () => {
    it("activate is re-exported from SDK and is a function", () => {
      expect(typeof activate).toBe("function");
    });
  });
});
