
import React from 'react';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { BookCard } from './BookCard';
import { BookSummary } from '../hooks/useBookLibrary';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  BookOpen: () => <div data-testid="book-open-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
}));

// @ts-ignore
window.document = window.document || {};

describe('BookCard', () => {
  const mockBook: BookSummary = {
    id: '1',
    title: 'Test Book',
    coverImage: 'test-image.jpg',
    pageCount: 5,
    lastUpdated: Date.now(),
    theme: 'Test Theme',
    ageGroup: 'Toddler' as any,
    style: 'Cartoon' as any,
    pages: []
  };

  const mockOnOpen = vi.fn();
  const mockOnDelete = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<BookCard book={mockBook} onOpen={mockOnOpen} onDelete={mockOnDelete} />);
    expect(screen.getByText('Test Book')).toBeTruthy();
    expect(screen.getByText('5 Pages')).toBeTruthy();
  });

  it('calls onOpen when the card button is clicked', () => {
    render(<BookCard book={mockBook} onOpen={mockOnOpen} onDelete={mockOnDelete} />);
    // Find the main button (it has the title inside)
    // The delete button also has "Test Book" in its label ("Delete Test Book"), so we need to be specific
    const buttons = screen.getAllByRole('button');
    // The first button should be the main card button because of DOM order
    buttons[0].click();
    expect(mockOnOpen).toHaveBeenCalledWith('1');
  });

  it('calls onDelete only after confirmation', async () => {
    render(<BookCard book={mockBook} onOpen={mockOnOpen} onDelete={mockOnDelete} />);
    // Find the delete button
    const deleteButton = screen.getByLabelText(/Delete Test Book/i);

    // First click: triggers confirmation state
    fireEvent.click(deleteButton);
    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(await screen.findByText('Confirm?')).toBeTruthy();

    // Second click: actually deletes
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('does not trigger onOpen when delete is clicked', () => {
    render(<BookCard book={mockBook} onOpen={mockOnOpen} onDelete={mockOnDelete} />);
    const deleteButton = screen.getByLabelText(/Delete Test Book/i);
    fireEvent.click(deleteButton);
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalled();
    expect(mockOnOpen).not.toHaveBeenCalled();
  });
});
