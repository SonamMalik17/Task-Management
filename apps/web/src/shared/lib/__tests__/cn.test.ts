import { cn } from '../cn';

describe('cn', () => {
  it('merges conditional class names', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  it('resolves Tailwind conflicts (later wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('keeps non-conflicting utilities', () => {
    expect(cn('px-2', 'py-1')).toContain('px-2');
    expect(cn('px-2', 'py-1')).toContain('py-1');
  });
});
