import request from "supertest";
import { describe, expect, it } from "vitest";
import express from "express";

const app = express();
app.get("/api/v1/health", (_req, res) => {
  res.json({ success: true });
});

describe("health endpoint", () => {
  it("returns ok payload", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
