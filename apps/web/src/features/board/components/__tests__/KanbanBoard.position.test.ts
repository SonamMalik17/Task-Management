// Position math is the load-bearing logic for Kanban drag-drop. Pulled out
// of the component module to keep it testable in isolation. (If we ever want
// to also test through the DnD harness we'd add RTL + jsdom — that flow is
// covered manually because dnd-kit's testing story is heavy.)

function computeNewPosition(
  positions: number[],
  insertAtIndex: number | null,
): number {
  if (positions.length === 0) return 1024;
  if (insertAtIndex === null || insertAtIndex >= positions.length) {
    return positions[positions.length - 1]! + 1024;
  }
  if (insertAtIndex === 0) return positions[0]! / 2;
  return (positions[insertAtIndex - 1]! + positions[insertAtIndex]!) / 2;
}

describe('computeNewPosition (Kanban)', () => {
  it('empty column → 1024', () => {
    expect(computeNewPosition([], null)).toBe(1024);
  });

  it('append → last + 1024', () => {
    expect(computeNewPosition([1024, 2048], null)).toBe(3072);
  });

  it('insert at index 0 → half of first', () => {
    expect(computeNewPosition([1024], 0)).toBe(512);
  });

  it('insert between → midpoint', () => {
    expect(computeNewPosition([1024, 2048], 1)).toBe(1536);
  });
});
