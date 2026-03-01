import { reactive } from 'vue';
import { FirestoreStore, toColorTagArray, type ColorTag } from 'cic-kit';
import { Tag, createTagData, type TagData } from '../models/Tag';

class TagStore extends FirestoreStore<Tag, TagData> {
  constructor() {
    super(Tag);
  }

  asColorTags() {
    return this.itemsActiveArray.map((item) => item.tag);
  }

  findByLabel(label: string) {
    const normalized = String(label ?? '').trim().toLowerCase();
    if (!normalized) return undefined;
    return this.itemsActiveArray.find((item) => item.tag.label.trim().toLowerCase() === normalized);
  }

  async upsert(tags: ColorTag[], updateBy: string) {
    const normalizedTags = toColorTagArray(tags);
    if (!normalizedTags.length) return;

    const byLabel = new Map(this.itemsActiveArray.map((item) => [item.tag.label.trim().toLowerCase(), item]));

    for (const tag of normalizedTags) {
      const key = tag.label.trim().toLowerCase();
      const existing = byLabel.get(key);

      if (existing) {
        if (existing.tag.color !== tag.color) {
          await existing.update({ tag, updateBy });
        }
        continue;
      }

      await this.add(createTagData(tag, updateBy));
    }
  }
}

export const tagStore = reactive(new TagStore());
