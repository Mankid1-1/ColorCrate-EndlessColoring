import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BookViewer } from './BookViewer';
import { AppTier, PageData } from '../types';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Mock dependencies
vi.mock('lucide-react', () => ({
  Printer: () => <span data-testid="icon-printer">Printer</span>,
  Download: () => <span data-testid="icon-download">Download</span>,
  RefreshCw: () => <span data-testid="icon-refresh">Refresh</span>,
  Edit3: () => <span data-testid="icon-edit">Edit</span>,
  X: () => <span data-testid="icon-close">Close</span>,
  Share2: () => <span data-testid="icon-share">Share</span>,
  Lock: () => <span data-testid="icon-lock">Lock</span>,
}));

vi.mock('./CreativeEditor', () => ({
  CreativeEditor: () => <div data-testid="creative-editor">Creative Editor</div>
}));

vi.mock('./Tooltip', () => ({
  Tooltip: ({ children, content }: { children: React.ReactNode; content: string }) => (
    <div data-testid={`tooltip-${content}`}>{children}</div>
  )
}));

// Mock BookPageThumbnail to simplify interaction
vi.mock('./BookPageThumbnail', () => ({
  BookPageThumbnail: ({ onFocus, page }: { onFocus: (id: string) => void; page: PageData }) => (
    <button data-testid={`thumbnail-${page.id}`} onClick={() => onFocus(page.id)}>
      Thumbnail {page.id}
    </button>
  )
}));

describe('BookViewer', () => {
  afterEach(() => {
    cleanup();
  });

  const mockPages: PageData[] = [
    {
      id: 'page-1',
      originalUrl: 'http://example.com/1.png',
      modifiedUrl: null,
      promptUsed: 'test',
      createdAt: 123
    }
  ];

  const defaultProps = {
    pages: mockPages,
    theme: 'Test Book',
    tier: AppTier.FREE,
    onRegeneratePage: vi.fn(),
    onUpdatePage: vi.fn(),
    onUpgrade: vi.fn()
  };

  it('opens focus modal when thumbnail is clicked', () => {
    render(<BookViewer {...defaultProps} />);

    // Click thumbnail
    fireEvent.click(screen.getByTestId('thumbnail-page-1'));

    // Check if modal is open (look for Close button or Page Options)
    expect(screen.getByTestId('icon-close')).toBeInTheDocument();
    expect(screen.getByText('Page Options')).toBeInTheDocument();
  });

  it('closes focus modal when Escape key is pressed', () => {
    render(<BookViewer {...defaultProps} />);

    // Open modal
    fireEvent.click(screen.getByTestId('thumbnail-page-1'));
    expect(screen.getByTestId('icon-close')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    // Modal should be closed
    expect(screen.queryByTestId('icon-close')).not.toBeInTheDocument();
    expect(screen.queryByText('Page Options')).not.toBeInTheDocument();
  });
});
