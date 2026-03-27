import { TestBed } from '@angular/core/testing';
import { NoteCard } from './note-card.component';
import { describe, it, expect, beforeEach } from 'vitest';
import type { NoteWithTags } from '../../../core/models';

function makeNote(overrides: Partial<NoteWithTags> = {}): NoteWithTags {
  return {
    id: 'note-001',
    title: 'Test Note',
    body: '# Hello\nWorld',
    engagement_id: 'eng-001',
    folder_id: 'f1',
    access_level: 'boundary',
    archived: false,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    tags: 'compliance, soc-2',
    ...overrides,
  } as NoteWithTags;
}

describe('NoteCard', () => {
  let component: NoteCard;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [NoteCard] });
    const fixture = TestBed.createComponent(NoteCard);
    component = fixture.componentInstance;
    component.note = makeNote();
  });

  it('should parse tags from comma-separated string', () => {
    expect(component.tagList).toEqual(['compliance', 'soc-2']);
  });

  it('should return empty array for null tags', () => {
    component.note = makeNote({ tags: undefined });
    expect(component.tagList).toEqual([]);
  });

  it('should toggle expanded state', () => {
    expect(component.expanded()).toBe(false);
    component.toggleExpand();
    expect(component.expanded()).toBe(true);
    component.toggleExpand();
    expect(component.expanded()).toBe(false);
  });

  it('should emit edit event with note data', () => {
    let emittedId = '';
    component.edit.subscribe((n: NoteWithTags) => { emittedId = n.id; });
    component.onEdit();
    expect(emittedId).toBe('note-001');
  });

  it('should return correct access icons', () => {
    expect(component.accessIcon('personal')).toBe('lock');
    expect(component.accessIcon('project')).toBe('business');
    expect(component.accessIcon('boundary')).toBe('groups');
  });

  it('should return correct access labels', () => {
    expect(component.accessLabel('personal')).toBe('Personal');
    expect(component.accessLabel('project')).toBe('Project');
    expect(component.accessLabel('boundary')).toBe('Boundary');
  });
});
