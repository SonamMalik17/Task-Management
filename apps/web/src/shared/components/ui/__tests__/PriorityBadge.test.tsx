import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '../PriorityBadge';

describe('PriorityBadge', () => {
  it.each(['low', 'medium', 'high', 'urgent'] as const)('renders %s', (p) => {
    render(<PriorityBadge priority={p} />);
    expect(screen.getByText(p)).toBeInTheDocument();
  });
});
