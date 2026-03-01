import {
  COLOR_TAG_DEFAULT_COLOR,
  FirestoreModel,
  normalizeColorTagLabel,
  toColorTag,
  type ColorTag,
  type Timestampble,
} from 'cic-kit';

function normalizeString(value: unknown, maxLength = 120) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';
  return normalized.slice(0, maxLength);
}

function normalizeTag(value: unknown): ColorTag {
  const normalized = toColorTag(value);
  return normalized ?? { label: 'tag', color: COLOR_TAG_DEFAULT_COLOR };
}

export function buildTagId(label: string) {
  const slug = normalizeColorTagLabel(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);

  return slug || 'tag';
}

export interface TagData extends Partial<Timestampble> {
  id: string;
  tag: ColorTag;
  updateBy: string;
}

export class Tag extends FirestoreModel<TagData> {
  static collectionName = 'tags';

  tag: ColorTag;
  updateBy: string;

  constructor(data: TagData) {
    super(data);
    this.tag = normalizeTag(data.tag);
    this.updateBy = normalizeString(data.updateBy, 120) || 'system';
  }

  toData(): TagData {
    const tag = normalizeTag(this.tag);

    return {
      id: buildTagId(tag.label),
      tag,
      updateBy: normalizeString(this.updateBy, 120) || 'system',
      ...this.timestampbleProps(),
    };
  }
}

export function createTagData(tag: ColorTag, updateBy: string): TagData {
  const normalizedTag = normalizeTag(tag);
  const normalizedUpdateBy = normalizeString(updateBy, 120) || 'system';

  return {
    id: buildTagId(normalizedTag.label),
    tag: normalizedTag,
    updateBy: normalizedUpdateBy,
  };
}
