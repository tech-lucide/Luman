import { expect, test } from "@playwright/test";

test("Mocked App Walkthrough: Dashboard -> Workspace -> Editor", async ({ page }) => {
  // Capture all logs
  page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("BROWSER ERROR:", err));
  page.on("requestfailed", (req) => console.log("REQ FAILED:", req.url(), req.failure()?.errorText));

  // --- MOCK API RESPONSES ---

  // 1. Mock Session
  await page.route("**/api/auth/session", async (route) => {
    console.log("MOCK HIT: /api/auth/session");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          userId: "user-1",
          role: "founder",
          ownerName: "TestUser",
        },
      }),
    });
  });

  // 2. Mock Workspaces
  await page.route("**/api/workspaces", async (route) => {
    console.log("MOCK HIT: /api/workspaces");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "ws-1", owner_name: "TestWorkspace", role: "founder", created_at: new Date().toISOString() },
      ]),
    });
  });

  // 3. Mock Notes List
  await page.route("**/api/notes?workspaceId=ws-1", async (route) => {
    console.log("MOCK HIT: /api/notes (GET)");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // 4. Mock Create Note (POST)
  await page.route("**/api/notes", async (route) => {
    if (route.request().method() === "POST") {
      console.log("MOCK HIT: /api/notes (POST)");
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "note-new-1",
          title: "New Note",
          content: {},
          workspace_id: "ws-1",
        }),
      });
    } else {
      await route.continue();
    }
  });

  // 5. Mock Individual Note (GET) for redirects
  await page.route("**/api/notes/note-new-1", async (route) => {
    console.log("MOCK HIT: /api/notes/note-new-1");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "note-new-1",
        title: "New Note",
        content: { type: "doc", content: [] },
      }),
    });
  });

  // --- TEST STEPS ---

  console.log("1. Navigating to Dashboard...");
  // Use http://localhost:3000 to match typical fetch behavior
  await page.goto("http://localhost:3000/dashboard", { timeout: 30000 });

  console.log("Page URL after nav:", page.url());

  // Wait for loading to potentially finish
  await page.waitForTimeout(2000);

  const content = await page.content();
  if (content.includes("Loading...")) {
    console.log("STILL LOADING DETECTED");
  }
  if (content.includes("Sign in")) {
    console.log("REDIRECTED TO LOGIN DETECTED");
  }

  // Expectation
  try {
    await expect(page.getByText("All Workspaces")).toBeVisible({ timeout: 5000 });
    console.log("SUCCESS: Dashboard loaded.");
  } catch (e) {
    console.log("FAILURE: content dump:", await page.content());
    throw e;
  }

  // If we get here, continue
  console.log("2. Clicking Workspace...");
  await page.getByText("TestWorkspace").click();

  console.log("3. Clicking New Note...");
  await expect(page.getByRole("link", { name: "New Note" })).toBeVisible({ timeout: 10000 });
  await page.getByRole("link", { name: "New Note" }).click();

  console.log("4. Waiting for Editor...");
  await expect(page.locator(".ProseMirror")).toBeVisible({ timeout: 15000 });

  console.log("TEST PASSED!");
});
