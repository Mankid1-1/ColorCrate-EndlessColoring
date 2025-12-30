import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, vi, expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { BookPageThumbnail } from './BookPageThumbnail';
import { PageData } from '../types';

expect.extend(matchers);

describe('BookPageThumbnail', () => {
    afterEach(() => {
        cleanup();
    });

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

    it('uses eager loading when priority is true', () => {
        render(
            <BookPageThumbnail
                page={mockPage}
                index={0}
                isFailed={false}
                priority={true}
                {...mockHandlers}
            />
        );

        const img = screen.getByAltText('Page 1');
        expect(img).toHaveAttribute('loading', 'eager');
        expect(img).toHaveAttribute('fetchPriority', 'high');
    });

    it('uses lazy loading by default', () => {
        render(
            <BookPageThumbnail
                page={mockPage}
                index={10}
                isFailed={false}
                {...mockHandlers}
            />
        );

        const img = screen.getByAltText('Page 11');
        expect(img).toHaveAttribute('loading', 'lazy');
        expect(img).toHaveAttribute('fetchPriority', 'low');
    });
});
