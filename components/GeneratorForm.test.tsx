// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneratorForm } from './GeneratorForm';
import { AppTier, BookSize } from '../types';
import { describe, it, expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend expect with jest-dom matchers
expect.extend(matchers);

describe('GeneratorForm', () => {
  it('resets bookSize to SINGLE when tier changes to FREE', () => {
    const onGenerate = vi.fn();
    const onUpgrade = vi.fn();

    // 1. Render with PRO tier
    const { rerender } = render(
      <GeneratorForm
        onGenerate={onGenerate}
        isLoading={false}
        tier={AppTier.PRO}
        onUpgrade={onUpgrade}
      />
    );

    // 2. Select book size 4 (SMALL)
    const size4Button = screen.getByLabelText(/4 pages/i);
    fireEvent.click(size4Button);

    // Assert that size 4 is selected
    expect(size4Button).toHaveAttribute('aria-checked', 'true');

    // 3. Change tier to FREE
    rerender(
      <GeneratorForm
        onGenerate={onGenerate}
        isLoading={false}
        tier={AppTier.FREE}
        onUpgrade={onUpgrade}
      />
    );

    // 4. Assert that bookSize is reset to 1 (SINGLE)
    // When tier is FREE, the aria-label for size 1 should just be "1 page"
    const size1Button = screen.getByLabelText(/1 page/i);

    // For size 4, it should be locked. The aria-label is constructed as:
    // `Unlock ${size} pages with Pro`
    // So for size 4 locked: "Unlock 4 pages with Pro"
    const size4ButtonLocked = screen.getByLabelText(/Unlock 4 pages with Pro/i);

    expect(size1Button).toHaveAttribute('aria-checked', 'true');
    expect(size4ButtonLocked).toHaveAttribute('aria-checked', 'false');
    // It should NOT be disabled anymore, so we can click it to upgrade
    expect(size4ButtonLocked).toBeEnabled();
  });
});
