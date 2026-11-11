import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { redirect } from "next/navigation";
import { keepScreenOnFailure } from "@/app/lib/keep-screen-on-failure";

describe("keepScreenOnFailure", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should not call onFailure when the task succeeds", async () => {
    // Arrange
    const onFailure = vi.fn();

    // Act
    await keepScreenOnFailure(async () => {}, onFailure);

    // Assert
    expect(onFailure).not.toHaveBeenCalled();
  });

  test("should call onFailure without any argument when the task throws", async () => {
    // Arrange
    const onFailure = vi.fn();

    // Act
    await keepScreenOnFailure(async () => {
      throw new Error("https://internal.example/secret failed");
    }, onFailure);

    // Assert
    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(onFailure).toHaveBeenCalledWith();
  });

  test("should not rethrow when the task throws", async () => {
    // Act & Assert
    await expect(
      keepScreenOnFailure(async () => {
        throw new Error("network down");
      }, vi.fn()),
    ).resolves.toBeUndefined();
  });

  test("should rethrow a redirect error without calling onFailure", async () => {
    // Arrange
    const onFailure = vi.fn();

    // Act & Assert
    await expect(
      keepScreenOnFailure(async () => {
        redirect("/somewhere");
      }, onFailure),
    ).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });
    expect(onFailure).not.toHaveBeenCalled();
  });
});
