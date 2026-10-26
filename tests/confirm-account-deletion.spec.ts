import { expect, test } from "@playwright/test";

// The API is mocked here; token verification is the backend's responsibility.
const deletionToken = [
  Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  ),
  Buffer.from(
    JSON.stringify({ email: "Test@Example.COM", type: "account_deletion" }),
  ).toString("base64url"),
  "test-signature",
].join(".");

const deletionScenarios = [
  {
    name: "account is deleted only after explicit confirmation",
    currentUserEmail: " Test@Example.COM ",
  },
  {
    name: "deletion clears the token account's data when another account is signed in",
    currentUserEmail: "other@example.com",
  },
  {
    name: "deletion clears the token account's data when signed out",
    currentUserEmail: null,
  },
];

for (const scenario of deletionScenarios) {
  test(scenario.name, async ({ page }) => {
    let deleteRequestCount = 0;
    let deleteRequestMethod = "";
    let deleteRequestUrl = "";

    await page.route(
      "**/user/confirm-delete-account?token=*",
      async (route) => {
        deleteRequestCount += 1;
        deleteRequestMethod = route.request().method();
        deleteRequestUrl = route.request().url();

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Account deleted successfully" }),
        });
      },
    );

    await page.addInitScript((currentUserEmail) => {
      if (currentUserEmail) {
        localStorage.setItem("access_token", "test-access-token");
        localStorage.setItem("user_email", currentUserEmail);
      }

      localStorage.setItem("portfolioEntries", "legacy-portfolio");
      localStorage.setItem(
        "portfolioEntries:test@example.com",
        "deleted-account-portfolio",
      );
      localStorage.setItem(
        "portfolioEntries:other@example.com",
        "other-account-portfolio",
      );
    }, scenario.currentUserEmail);

    await page.goto(
      `/confirm-account-deletion?token=${encodeURIComponent(deletionToken)}`,
    );

    const deleteButton = page.getByRole("button", {
      name: "Permanently Delete My Account",
    });

    await expect(deleteButton).toBeVisible();
    await page.waitForTimeout(1000);

    expect(deleteRequestCount).toBe(0);
    expect(
      await page.evaluate(() =>
        localStorage.getItem("portfolioEntries:test@example.com"),
      ),
    ).toBe("deleted-account-portfolio");

    await deleteButton.click();
    await expect.poll(() => deleteRequestCount).toBe(1);

    expect(deleteRequestMethod).toBe("POST");
    expect(new URL(deleteRequestUrl).searchParams.get("token")).toBe(
      deletionToken,
    );
    await expect(page.getByText(/Account deleted successfully/i)).toBeVisible();

    const storedValues = await page.evaluate(() => ({
      accessToken: localStorage.getItem("access_token"),
      userEmail: localStorage.getItem("user_email"),
      legacyPortfolio: localStorage.getItem("portfolioEntries"),
      deletedAccountPortfolio: localStorage.getItem(
        "portfolioEntries:test@example.com",
      ),
      otherAccountPortfolio: localStorage.getItem(
        "portfolioEntries:other@example.com",
      ),
    }));

    expect(storedValues.accessToken).toBeNull();
    expect(storedValues.userEmail).toBeNull();
    expect(storedValues.legacyPortfolio).toBeNull();
    expect(storedValues.deletedAccountPortfolio).toBeNull();
    expect(storedValues.otherAccountPortfolio).toBe("other-account-portfolio");
  });
}

test("failed deletion preserves the session and portfolio data", async ({
  page,
}) => {
  await page.route("**/user/confirm-delete-account?token=*", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        detail: "Account deletion token is no longer valid",
      }),
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem("access_token", "test-access-token");
    localStorage.setItem("user_email", "test@example.com");
    localStorage.setItem("portfolioEntries", "legacy-portfolio");
    localStorage.setItem(
      "portfolioEntries:test@example.com",
      "deleted-account-portfolio",
    );
    localStorage.setItem(
      "portfolioEntries:other@example.com",
      "other-account-portfolio",
    );
  });

  await page.goto(
    `/confirm-account-deletion?token=${encodeURIComponent(deletionToken)}`,
  );
  await page
    .getByRole("button", { name: "Permanently Delete My Account" })
    .click();
  await expect(
    page.getByText(
      "Error deleting account: Account deletion token is no longer valid",
    ),
  ).toBeVisible();

  const storedValues = await page.evaluate(() => ({
    accessToken: localStorage.getItem("access_token"),
    userEmail: localStorage.getItem("user_email"),
    legacyPortfolio: localStorage.getItem("portfolioEntries"),
    deletedAccountPortfolio: localStorage.getItem(
      "portfolioEntries:test@example.com",
    ),
    otherAccountPortfolio: localStorage.getItem(
      "portfolioEntries:other@example.com",
    ),
  }));

  expect(storedValues.accessToken).toBe("test-access-token");
  expect(storedValues.userEmail).toBe("test@example.com");
  expect(storedValues.legacyPortfolio).toBe("legacy-portfolio");
  expect(storedValues.deletedAccountPortfolio).toBe(
    "deleted-account-portfolio",
  );
  expect(storedValues.otherAccountPortfolio).toBe("other-account-portfolio");
});
