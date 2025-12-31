import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { CreativeEditor } from './CreativeEditor';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  MousePointer2: () => <div />,
  Type: () => <div />,
  Sticker: () => <div />,
  PenTool: () => <div />,
  Eraser: () => <div />,
  Check: () => <div />,
  X: () => <div />,
  Undo: () => <div />,
  Trash2: () => <div />,
  Redo: () => <div />,
  RotateCw: () => <div />,
  RotateCcw: () => <div />,
}));

describe('CreativeEditor Accessibility', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  afterEach(() => {
    cleanup();
  });

  it('has accessible labels for all icon-only buttons', () => {
    render(
      <CreativeEditor
        pageId="1"
        baseImage="test.jpg"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Close button - checking specifically for accessible name
    // Using getAllByRole because there might be multiple buttons, we want to ensure ONE of them has this name
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();

    // Undo/Redo
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
  });
});
