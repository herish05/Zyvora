import { describe, expect, it } from "vitest";
import { canTransitionPublicationStatus } from "./product.types.js";

describe("canTransitionPublicationStatus", () => {
  it("allows valid transitions", () => {
    expect(canTransitionPublicationStatus("draft", "published")).toBe(true);
    expect(canTransitionPublicationStatus("published", "unpublished")).toBe(true);
    expect(canTransitionPublicationStatus("unpublished", "published")).toBe(true);
  });

  it("blocks invalid transitions", () => {
    expect(canTransitionPublicationStatus("archived", "published")).toBe(false);
    expect(canTransitionPublicationStatus("draft", "unpublished")).toBe(false);
  });
});
