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

function buildProjectTagId(projectId: string, label: string) {
  const project = normalizeString(projectId, 120);
  const slug = normalizeColorTagLabel(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return `${project}__${slug || 'tag'}`;
}

export interface ProjectTagData extends Partial<Timestampble> {
  id: string;
  projectId: string;
  tag: ColorTag;
  updateBy: string;
}

export class ProjectTag extends FirestoreModel<ProjectTagData> {
  static collectionName = 'projectTags';

  projectId: string;
  tag: ColorTag;
  updateBy: string;

  constructor(data: ProjectTagData) {
    super(data);
    this.projectId = normalizeString(data.projectId, 120);
    this.tag = normalizeTag(data.tag);
    this.updateBy = normalizeString(data.updateBy, 120) || 'system';
  }

  toData(): ProjectTagData {
    const projectId = normalizeString(this.projectId, 120);
    const tag = normalizeTag(this.tag);

    return {
      id: buildProjectTagId(projectId, tag.label),
      projectId,
      tag,
      updateBy: normalizeString(this.updateBy, 120) || 'system',
      ...this.timestampbleProps(),
    };
  }
}

export function createProjectTagData(projectId: string, tag: ColorTag, updateBy: string): ProjectTagData {
  const normalizedProjectId = normalizeString(projectId, 120);
  const normalizedTag = normalizeTag(tag);
  const normalizedUpdateBy = normalizeString(updateBy, 120) || 'system';

  return {
    id: buildProjectTagId(normalizedProjectId, normalizedTag.label),
    projectId: normalizedProjectId,
    tag: normalizedTag,
    updateBy: normalizedUpdateBy,
  };
}
