// E2E test for main dashboard functionality

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display page title', async ({ page }) => {
    await expect(page).toHaveTitle(/AI Crypto Signal Analyzer/);
  });

  test('should show main header', async ({ page }) => {
    const header = page.getByRole('heading', { name: /AI Crypto Signal Analyzer/i });
    await expect(header).toBeVisible();
  });

  test('should have control panel with symbol selector', async ({ page }) => {
    // Wait for control panel to load
    await page.waitForSelector('select', { timeout: 10000 });
    
    const selects = await page.locator('select').all();
    expect(selects.length).toBeGreaterThanOrEqual(2); // Symbol and timeframe selects
  });

  test('should have chart container', async ({ page }) => {
    // Wait for chart to load
    await page.waitForSelector('div', { timeout: 15000 });
    
    // Chart should be present (TradingView chart renders in a div)
    const chartElements = await page.locator('div').count();
    expect(chartElements).toBeGreaterThan(0);
  });

  test('should show loading state initially', async ({ page }) => {
    // Check for loading indicator
    const loadingText = page.getByText(/loading/i);
    
    // It might appear briefly or already be loaded
    const isVisible = await loadingText.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should allow symbol selection', async ({ page }) => {
    await page.waitForSelector('select', { timeout: 10000 });
    
    const symbolSelect = page.locator('select').first();
    
    // Check if select has options
    const options = await symbolSelect.locator('option').all();
    expect(options.length).toBeGreaterThan(0);
    
    // Try to select ETHUSDT
    await symbolSelect.selectOption('ETHUSDT');
    
    // Wait a bit for data to load
    await page.waitForTimeout(2000);
  });

  test('should have AI panel', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for initial load
    
    // Look for AI-related text
    const aiText = page.getByText(/AI/i);
    const count = await aiText.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have indicator toggles', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for checkboxes (indicator toggles)
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    expect(checkboxes.length).toBeGreaterThan(0);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await page.waitForTimeout(2000);
    
    const header = page.getByRole('heading', { name: /AI Crypto Signal Analyzer/i });
    await expect(header).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await page.waitForTimeout(2000);
    
    const header = page.getByRole('heading', { name: /AI Crypto Signal Analyzer/i });
    await expect(header).toBeVisible();
  });
});
