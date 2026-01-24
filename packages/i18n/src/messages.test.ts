import { describe, expect, it } from "vitest";
import {
  loadMessages,
  getMessagesSync,
  formatMessage,
  hasMessage,
  preloadMessages,
  type Messages,
} from "./messages";

describe("messages", () => {
  describe("loadMessages", () => {
    it("loads English messages", async () => {
      const messages = await loadMessages("en");
      expect(messages).toBeDefined();
      expect(typeof messages).toBe("object");
    });

    it("loads Spanish messages", async () => {
      const messages = await loadMessages("es");
      expect(messages).toBeDefined();
      expect(typeof messages).toBe("object");
    });

    it("caches loaded messages", async () => {
      const messages1 = await loadMessages("en");
      const messages2 = await loadMessages("en");
      expect(messages1).toBe(messages2);
    });

    it("loads different locales independently", async () => {
      const enMessages = await loadMessages("en");
      const esMessages = await loadMessages("es");
      expect(enMessages).not.toBe(esMessages);
    });
  });

  describe("getMessagesSync", () => {
    it("returns null for unloaded locale", () => {
      const messages = getMessagesSync("ca");
      expect(messages).toBeNull();
    });

    it("returns cached messages after loading", async () => {
      await loadMessages("en");
      const messages = getMessagesSync("en");
      expect(messages).not.toBeNull();
      expect(typeof messages).toBe("object");
    });
  });

  describe("formatMessage", () => {
    const mockMessages: Messages = {
      simple: "Hello",
      nested: {
        key: "World",
      },
      withParam: "Hello {name}",
      complex: "You have {count, plural, one {# message} other {# messages}}",
    };

    it("returns simple message", () => {
      const result = formatMessage(mockMessages, "simple");
      expect(result).toBe("Hello");
    });

    it("returns nested message", () => {
      const result = formatMessage(mockMessages, "nested.key");
      expect(result).toBe("World");
    });

    it("returns key when message not found", () => {
      const result = formatMessage(mockMessages, "nonexistent");
      expect(result).toBe("nonexistent");
    });

    it("formats message with parameters", () => {
      const result = formatMessage(mockMessages, "withParam", { name: "John" });
      expect(result).toBe("Hello John");
    });

    it("returns message without params if none provided", () => {
      const result = formatMessage(mockMessages, "simple");
      expect(result).toBe("Hello");
    });

    it("returns message without params if empty object provided", () => {
      const result = formatMessage(mockMessages, "simple", {});
      expect(result).toBe("Hello");
    });

    it("handles invalid message format gracefully", () => {
      const result = formatMessage(mockMessages, "simple", { name: "test" });
      expect(result).toBe("Hello");
    });

    it("returns key when message is not a string", () => {
      const result = formatMessage(mockMessages, "nested");
      expect(result).toBe("nested");
    });
  });

  describe("hasMessage", () => {
    const mockMessages: Messages = {
      simple: "Hello",
      nested: {
        key: "World",
        deep: {
          value: "Test",
        },
      },
    };

    it("returns true for existing simple message", () => {
      expect(hasMessage(mockMessages, "simple")).toBe(true);
    });

    it("returns true for existing nested message", () => {
      expect(hasMessage(mockMessages, "nested.key")).toBe(true);
    });

    it("returns true for deeply nested message", () => {
      expect(hasMessage(mockMessages, "nested.deep.value")).toBe(true);
    });

    it("returns false for nonexistent message", () => {
      expect(hasMessage(mockMessages, "nonexistent")).toBe(false);
    });

    it("returns false for partial path", () => {
      expect(hasMessage(mockMessages, "nested.nonexistent")).toBe(false);
    });

    it("returns true for nested object", () => {
      expect(hasMessage(mockMessages, "nested")).toBe(true);
    });
  });

  describe("preloadMessages", () => {
    it("preloads single locale", async () => {
      await preloadMessages(["en"]);
      const messages = getMessagesSync("en");
      expect(messages).not.toBeNull();
    });

    it("preloads multiple locales", async () => {
      await preloadMessages(["en", "es", "fr"]);

      expect(getMessagesSync("en")).not.toBeNull();
      expect(getMessagesSync("es")).not.toBeNull();
      expect(getMessagesSync("fr")).not.toBeNull();
    });

    it("handles empty array", async () => {
      await expect(preloadMessages([])).resolves.toBeUndefined();
    });
  });
});
