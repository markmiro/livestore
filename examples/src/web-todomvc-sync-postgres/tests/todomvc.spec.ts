import { expect, test } from '@playwright/test'

test.setTimeout(60_000)

test.describe('TodoMVC (sync-cf)', () => {
  test('adds and toggles todos', async ({ baseURL, page }) => {
    if (!baseURL) throw new Error('baseURL is required')

    await page.goto(baseURL)

    const input = page.getByPlaceholder('What needs to be done?')
    await expect(input).toBeVisible({ timeout: 30_000 })

    const todoText = `Playwright todo ${Date.now()}`

    await input.fill(todoText)
    await input.press('Enter')

    const todoItem = page.getByRole('listitem').filter({ hasText: todoText }).first()
    await expect(todoItem).toBeVisible()

    const checkbox = todoItem.locator('input[type="checkbox"]').first()
    await checkbox.check()
    await expect(checkbox).toBeChecked()
  })

  test('multi-client sync: changes sync bidirectionally', async ({ baseURL, browser }) => {
    if (!baseURL) throw new Error('baseURL is required')

    // Generate a shared storeId so both clients sync to the same store
    const sharedStoreId = `test-multi-${Date.now()}`

    // Create two separate browser contexts (simulating two different clients/browsers)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // Client 1 opens the app with the shared storeId
    await page1.goto(`${baseURL}?storeId=${sharedStoreId}`)
    const input1 = page1.getByPlaceholder('What needs to be done?')
    await expect(input1).toBeVisible({ timeout: 30_000 })

    // Client 2 opens the app with the same shared storeId
    await page2.goto(`${baseURL}?storeId=${sharedStoreId}`)
    const input2 = page2.getByPlaceholder('What needs to be done?')
    await expect(input2).toBeVisible({ timeout: 30_000 })

    // Wait a bit for both clients to initialize and sync
    await page1.waitForTimeout(2000)
    await page2.waitForTimeout(2000)

    // Client 1 adds a todo
    const todo1Text = `Client 1 todo ${Date.now()}`
    await input1.fill(todo1Text)
    await input1.press('Enter')

    // Verify Client 1 sees its own todo
    const todo1Item1 = page1.getByRole('listitem').filter({ hasText: todo1Text }).first()
    await expect(todo1Item1).toBeVisible({ timeout: 10_000 })

    // Verify Client 2 receives Client 1's todo via sync
    const todo1Item2 = page2.getByRole('listitem').filter({ hasText: todo1Text }).first()
    await expect(todo1Item2).toBeVisible({ timeout: 10_000 })

    // Client 2 adds a todo
    const todo2Text = `Client 2 todo ${Date.now()}`
    await input2.fill(todo2Text)
    await input2.press('Enter')

    // Verify Client 2 sees its own todo
    const todo2Item2 = page2.getByRole('listitem').filter({ hasText: todo2Text }).first()
    await expect(todo2Item2).toBeVisible({ timeout: 10_000 })

    // Verify Client 1 receives Client 2's todo via sync (this is the critical test)
    const todo2Item1 = page1.getByRole('listitem').filter({ hasText: todo2Text }).first()
    await expect(todo2Item1).toBeVisible({ timeout: 10_000 })

    // Clean up
    await context1.close()
    await context2.close()
  })

  test('multi-client sync: alternating todos loop', async ({ baseURL, browser }) => {
    if (!baseURL) throw new Error('baseURL is required')

    // Generate a shared storeId so both clients sync to the same store
    const sharedStoreId = `test-alternating-${Date.now()}`

    // Create two separate browser contexts (simulating two different clients/browsers)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // Client 1 opens the app with the shared storeId
    await page1.goto(`${baseURL}?storeId=${sharedStoreId}`)
    const input1 = page1.getByPlaceholder('What needs to be done?')
    await expect(input1).toBeVisible({ timeout: 30_000 })

    // Client 2 opens the app with the same shared storeId
    await page2.goto(`${baseURL}?storeId=${sharedStoreId}`)
    const input2 = page2.getByPlaceholder('What needs to be done?')
    await expect(input2).toBeVisible({ timeout: 30_000 })

    // Wait a bit for both clients to initialize and sync
    await page1.waitForTimeout(2000)
    await page2.waitForTimeout(2000)

    // Track all todos that will be added
    const todos: string[] = []

    // Add 20 todos, alternating between clients
    for (let i = 0; i < 100; i++) {
      const clientNum = (i % 2) + 1
      const todoText = `Client ${clientNum} todo ${i} ${Date.now()}`
      todos.push(todoText)

      if (i % 2 === 0) {
        // Client 1 adds a todo
        await input1.fill(todoText)
        await input1.press('Enter')
      } else {
        // Client 2 adds a todo
        await input2.fill(todoText)
        await input2.press('Enter')
      }

      // Small delay to allow sync
      await page1.waitForTimeout(10)
      await page2.waitForTimeout(10)
    }

    // Wait a bit more for final sync to complete
    await page1.waitForTimeout(200)
    await page2.waitForTimeout(200)

    // Verify both clients see all 20 todos
    for (const todoText of todos) {
      const todoItem1 = page1.getByRole('listitem').filter({ hasText: todoText }).first()
      await expect(todoItem1).toBeVisible({ timeout: 10_000 })

      const todoItem2 = page2.getByRole('listitem').filter({ hasText: todoText }).first()
      await expect(todoItem2).toBeVisible({ timeout: 10_000 })
    }

    // Clean up
    await context1.close()
    await context2.close()
  })
})
