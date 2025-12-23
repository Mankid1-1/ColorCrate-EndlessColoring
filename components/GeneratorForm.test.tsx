import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { GeneratorForm } from './GeneratorForm';
import { AgeGroup, AppTier, ArtStyle, BookSize } from '../types';

expect.extend(matchers);

describe('GeneratorForm', () => {
  const mockOnGenerate = vi.fn();
  const mockOnUpgrade = vi.fn();

  const defaultProps = {
    onGenerate: mockOnGenerate,
    isLoading: false,
    tier: AppTier.FREE,
    onUpgrade: mockOnUpgrade
  };

  it('renders correctly', () => {
    render(<GeneratorForm {...defaultProps} />);
    expect(screen.getByText('What do you want to create?')).toBeInTheDocument();
  });

  it('clears theme input when clear button is clicked', () => {
    render(<GeneratorForm {...defaultProps} />);

    const inputs = screen.getAllByPlaceholderText(/e.g. A robot baking a giant cake/i);
    const input = inputs[0];
    fireEvent.change(input, { target: { value: 'My theme' } });

    expect(input).toHaveValue('My theme');

    const clearButton = screen.getByLabelText('Clear theme');
    fireEvent.click(clearButton);

    expect(input).toHaveValue('');
  });

  it('resets bookSize to SINGLE when tier changes to FREE', () => {
    const { rerender } = render(
      <GeneratorForm
        {...defaultProps}
        tier={AppTier.PRO}
      />
    );

    // Select 4 pages (BookSize.SMALL)
    const size4Button = screen.getByLabelText('4 pages');
    fireEvent.click(size4Button);

    expect(size4Button).toHaveAttribute('aria-checked', 'true');

    // Change tier to FREE
    rerender(
      <GeneratorForm
        {...defaultProps}
        tier={AppTier.FREE}
      />
    );

    // Size should reset to 1
    const size1Buttons = screen.getAllByLabelText(/1 page/i);
    const size1Button = size1Buttons[0];

    expect(size1Button).toHaveAttribute('aria-checked', 'true');
    expect(size4Button).toHaveAttribute('aria-checked', 'false');
  });
});
