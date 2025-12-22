import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import { BookPageThumbnail } from './BookPageThumbnail';
import { PageData } from '../types';

describe('BookPageThumbnail', () => {
    const mockPage: PageData = {
        id: '123',
        originalUrl: 'http://example.com/image.png',
        modifiedUrl: null,
        promptUsed: 'test',
        createdAt: 123456789
    };

    const mockHandlers = {
        onImageError: vi.fn(),
        onFocus: vi.fn(),
        onPrint: vi.fn(),
    };

    it('renders correctly', () => {
        render(
            <BookPageThumbnail
                page={mockPage}
                index={0}
                isFailed={false}
                {...mockHandlers}
            />
        );

        expect(screen.getByAltText('Page 1')).toBeDefined();
        expect(screen.getByText('1')).toBeDefined();
    });

    it('shows failed state', () => {
        render(
            <BookPageThumbnail
                page={mockPage}
                index={0}
                isFailed={true}
                {...mockHandlers}
            />
        );

        expect(screen.getByText('Failed to load image')).toBeDefined();
    });
});
