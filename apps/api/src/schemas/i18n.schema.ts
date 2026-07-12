import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class I18nText {
  @Prop({ required: true })
  zh: string;

  @Prop({ required: true })
  en: string;
}

export const I18nTextSchema = SchemaFactory.createForClass(I18nText);

export type I18nTextValue = { zh: string; en: string };

export function normalizeI18n(value: unknown, fallback = ''): I18nTextValue {
  if (value && typeof value === 'object' && 'zh' in value && 'en' in value) {
    const v = value as I18nTextValue;
    return { zh: v.zh || fallback, en: v.en || fallback };
  }
  if (typeof value === 'string') {
    return { zh: value, en: value };
  }
  return { zh: fallback, en: fallback };
}

export function pickI18n(value: unknown, lang: 'zh' | 'en' = 'zh'): string {
  const text = normalizeI18n(value);
  return lang === 'en' ? text.en || text.zh : text.zh || text.en;
}
