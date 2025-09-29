import { defineArrayMember, defineField, defineType } from 'sanity';

const categoryOptions = [
  { title: 'Theory', value: 'theory' },
  { title: 'Lens', value: 'lens' },
  { title: 'Mindset', value: 'mindset' },
  { title: 'Practice', value: 'practice' },
  { title: 'Method', value: 'method' }
];

export const Cards = defineType({
  name: 'cards',
  title: 'Cards',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'style', title: 'Style' },
    { name: 'resources', title: 'Resources' }
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
      group: 'content'
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
      group: 'content'
    }),
    defineField({
      name: 'letter',
      type: 'string',
      description: 'Single-letter identifier (A–Z).',
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(1)
          .regex(/^[A-Z]{1}$/i, { name: 'letter' }),
      group: 'content'
    }),
    defineField({
      name: 'category',
      type: 'string',
      options: { list: categoryOptions, layout: 'radio' },
      validation: (rule) => rule.required(),
      group: 'content'
    }),
    defineField({
      name: 'color',
      type: 'string',
      title: 'Accent Color',
      description: 'Hex value used for UI accents.',
      validation: (rule) => rule.regex(/^#([0-9a-f]{3}){1,2}$/i, { name: 'hex color' }),
      group: 'style'
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 4,
      group: 'content'
    }),
    defineField({
      name: 'prompt',
      type: 'text',
      rows: 5,
      group: 'content'
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'content'
    }),
    defineField({
      name: 'styleMeta',
      type: 'object',
      fields: [
        defineField({ name: 'icon', type: 'string', description: 'Optional icon id from design system' }),
        defineField({ name: 'pattern', type: 'string', description: 'Visual treatment or background pattern' }),
        defineField({ name: 'animation', type: 'string', description: 'Preferred animation name' })
      ],
      options: { collapsible: true },
      group: 'style'
    }),
    defineField({
      name: 'readingList',
      title: 'Reading List',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'reading',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'url', type: 'url' }),
            defineField({ name: 'annotation', type: 'text', rows: 2 })
          ]
        })
      ],
      group: 'resources'
    }),
    defineField({
      name: 'sources',
      title: 'Sources & Credits',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'source',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'url', type: 'url' })
          ]
        })
      ],
      group: 'resources'
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'letter'
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: subtitle ? subtitle.charAt(0).toUpperCase() + subtitle.slice(1) : undefined,
        media: media
          ? {
              _type: 'text',
              text: media
            }
          : undefined
      };
    }
  }
});
