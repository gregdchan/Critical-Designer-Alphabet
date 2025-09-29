import { defineType, defineField } from 'sanity';

export const cards = defineType({
  name: 'cards',
  title: 'Card',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content' },
    { name: 'meta', title: 'Metadata' },
    { name: 'style', title: 'Retro Style' },
    { name: 'localization', title: 'Localization' }
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().max(120)
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'meta',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'letter',
      title: 'Letter',
      type: 'string',
      group: 'meta',
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .max(1)
          .custom((value) => {
            if (!value) return true;
            return value === value.toUpperCase() ? true : 'Use uppercase letters (e.g., A).';
          })
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'meta',
      options: {
        list: [
          { title: 'Theory', value: 'theory' },
          { title: 'Practice', value: 'practice' },
          { title: 'Lens', value: 'lens' },
          { title: 'Mindset', value: 'mindset' },
          { title: 'Method', value: 'method' }
        ],
        layout: 'radio'
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      group: 'content',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'prompt',
      title: 'Prompt',
      type: 'text',
      rows: 5,
      group: 'content'
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'content',
      of: [{ type: 'string' }],
      options: { layout: 'tags' }
    }),
    defineField({
      name: 'sources',
      title: 'Sources',
      type: 'array',
      group: 'content',
      of: [{ type: 'url' }]
    }),
    defineField({
      name: 'readingList',
      title: 'Reading List',
      type: 'array',
      group: 'content',
      of: [{ type: 'resourceLink' }]
    }),
    defineField({
      name: 'exampleUse',
      title: 'Example Use Cases',
      type: 'array',
      group: 'content',
      of: [{ type: 'text' }]
    }),
    defineField({
      name: 'cardID',
      title: 'Public Card ID',
      type: 'string',
      group: 'meta',
      description: 'Shown to participants in app interfaces. Compose from letter + slug, e.g., C-CollectivePower.',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'postId',
      title: 'Post ID',
      type: 'string',
      group: 'meta',
      readOnly: true,
      description: 'Read-only ID for syncing with the app or external sources.'
    }),
    defineField({
      name: 'styleMeta',
      title: 'Retro Style Meta',
      type: 'object',
      group: 'style',
      fields: [
        defineField({
          name: 'icon',
          title: 'Icon Name',
          type: 'string',
          description: 'Icon slug, e.g., lucide icon id or custom sprite key.'
        }),
        defineField({
          name: 'neonColor',
          title: 'Neon Color',
          type: 'string',
          description: 'Hex or HSL value used for glow accents.',
          validation: (Rule) =>
            Rule.regex(/^#|hsl\(/, {
              name: 'color',
              invert: false
            }).warning('Use a valid hex or hsl color value, e.g., #ff2aad or hsl(310 100% 60%).')
        }),
        defineField({
          name: 'animationStyle',
          title: 'Animation Style',
          type: 'string',
          options: {
            list: [
              { title: 'Neon Pulse', value: 'neon-pulse' },
              { title: 'Scanline Flicker', value: 'scanline' },
              { title: 'Retro Bounce', value: 'bounce' },
              { title: 'Idle Glow', value: 'glow' }
            ]
          }
        })
      ]
    }),
    defineField({
      name: 'description_i18n',
      title: 'Description (Localized)',
      type: 'i18nText',
      group: 'localization'
    }),
    defineField({
      name: 'prompt_i18n',
      title: 'Prompt (Localized)',
      type: 'i18nText',
      group: 'localization'
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      letter: 'letter'
    },
    prepare({ title, subtitle, letter }) {
      return {
        title: `${letter ?? '?'} · ${title}`,
        subtitle: subtitle ? subtitle.charAt(0).toUpperCase() + subtitle.slice(1) : 'Uncategorized'
      };
    }
  }
});
