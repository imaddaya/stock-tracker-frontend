import { expect, test } from "@playwright/test";

test("email is verified only after explicit confirmation", async ({ page }) => {
  let verificationRequestCount = 0;
  let verificationRequestMethod = "";
  let verificationRequestUrl = "";

  await page.route("**/auth/verify-email?token=*", async (route) => {
    verificationRequestCount += 1;
    verificationRequestMethod = route.request().method();
    verificationRequestUrl = route.request().url();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Email verified successfully",
      }),
    });
  });

  await page.goto("/email-verified?token=test-verification-token");

  const verifyButton = page.getByRole("button", {
    name: "Verify Email",
  });

  await expect(verifyButton).toBeVisible();

  await page.waitForTimeout(1000);

  expect(verificationRequestCount).toBe(0);

  await verifyButton.click();

  await expect.poll(() => verificationRequestCount).toBe(1);

  expect(verificationRequestMethod).toBe("POST");

  const requestUrl = new URL(verificationRequestUrl);

  expect(requestUrl.searchParams.get("token")).toBe("test-verification-token");

  await expect(page.getByText(/Email verified successfully/i)).toBeVisible();
});
