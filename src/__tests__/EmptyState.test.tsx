import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../components/molecules/EmptyState';
import {
  EmptyRequestsIllustration,
  EmptyAdvisoriesIllustration,
  EmptyBillsIllustration,
  AllCaughtUpIllustration,
  EmptyTasksIllustration,
  NothingPendingIllustration,
  NoMatchesIllustration,
  ErrorOfflineIllustration,
  NotFoundIllustration,
} from '../components/illustrations';

describe('EmptyState Component', () => {
  it('renders illustration container with 128px height (h-32)', () => {
    const { container } = render(
      <EmptyState
        illustration={<EmptyRequestsIllustration />}
        title="No requests yet"
        description="No maintenance requests submitted yet."
      />
    );

    const illustrationWrapper = container.querySelector('.h-32');
    expect(illustrationWrapper).toBeInTheDocument();
    expect(screen.getByText('No requests yet')).toBeInTheDocument();
    expect(screen.getByText('No maintenance requests submitted yet.')).toBeInTheDocument();
  });

  it('renders title with maximum 3 words and at most one button', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        illustration={<NoMatchesIllustration />}
        title="No matches"
        description="No items match your filter criteria."
        actionLabel="Clear filters"
        onAction={handleClick}
      />
    );

    const titleElement = screen.getByText('No matches');
    expect(titleElement).toBeInTheDocument();
    const wordCount = 'No matches'.trim().split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(3);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Clear filters');

    fireEvent.click(buttons[0]);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders zero buttons when actionLabel and onAction are not provided', () => {
    render(
      <EmptyState
        illustration={<AllCaughtUpIllustration />}
        title="All caught up"
        description="You have no notifications."
      />
    );

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders all 9 Flowbite illustration components properly', () => {
    const illustrations = [
      { comp: <EmptyRequestsIllustration />, title: 'No requests yet' },
      { comp: <EmptyAdvisoriesIllustration />, title: 'No advisories' },
      { comp: <EmptyBillsIllustration />, title: 'No billing yet' },
      { comp: <AllCaughtUpIllustration />, title: 'All caught up' },
      { comp: <EmptyTasksIllustration />, title: 'No tasks' },
      { comp: <NothingPendingIllustration />, title: 'Nothing pending' },
      { comp: <NoMatchesIllustration />, title: 'No matches' },
      { comp: <ErrorOfflineIllustration />, title: 'Something went wrong' },
      { comp: <NotFoundIllustration />, title: 'Page not found' },
    ];

    illustrations.forEach(({ comp, title }) => {
      const { unmount } = render(
        <EmptyState illustration={comp} title={title} />
      );
      expect(screen.getByText(title)).toBeInTheDocument();
      const words = title.trim().split(/\s+/).length;
      expect(words).toBeLessThanOrEqual(3);
      unmount();
    });
  });
});

