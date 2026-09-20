import { expect, test } from "@playwright/test";

test("account is deleted only after explicit confirmation", async ({
  page,
}) => {
  let deleteRequestCount = 0;
  let deleteRequestMethod = "";
  let deleteRequestUrl = "";

  await page.route("**/user/confirm-delete-account?token=*", async (route) => {
    deleteRequestCount += 1;
    deleteRequestMethod = route.request().method();
    deleteRequestUrl = route.request().url();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Account deleted successfully",
      }),
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem("access_token", "test-access-token");
    localStorage.setItem("user_email", "test@example.com");
    localStorage.setItem("portfolioEntries", "test-portfolio");
  });

  await page.goto("/confirm-account-deletion?token=test-delete-token");

  const deleteButton = page.getByRole("button", {
    name: "Permanently Delete My Account",
  });

  await expect(deleteButton).toBeVisible();

  await page.waitForTimeout(1000);

  expect(deleteRequestCount).toBe(0);

  await deleteButton.click();

  await expect.poll(() => deleteRequestCount).toBe(1);

  expect(deleteRequestMethod).toBe("POST");

  const requestUrl = new URL(deleteRequestUrl);

  expect(requestUrl.searchParams.get("token")).toBe("test-delete-token");

  await expect(page.getByText(/Account deleted successfully/i)).toBeVisible();

  const storedValues = await page.evaluate(() => ({
    accessToken: localStorage.getItem("access_token"),
    userEmail: localStorage.getItem("user_email"),
    portfolioEntries: localStorage.getItem("portfolioEntries"),
  }));

  expect(storedValues.accessToken).toBeNull();
  expect(storedValues.userEmail).toBeNull();
  expect(storedValues.portfolioEntries).toBeNull();
});
