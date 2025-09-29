import { defineField, defineType } from 'sanity';

const categoryOptions = [
  { title: 'Theory', value: 'theory' },
  { title: 'Practice', value: 'practice' },
  { title: 'Lens', value: 'lens' },
  { title: 'Mindset', value: 'mindset' },
  { title: 'Method', value: 'method' }
];

export const Cards = defineType({
  name: 'cards',
  title: 'Cards',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'CardID',
      type: 'string',
      hidden: true
    }),
    defineField({
      name: 'type',
      type: 'string',
      hidden: true
    }),
    defineField({
      name: 'category',
      type: 'string',
      options: {
        list: categoryOptions,
        layout: 'radio'
      },
      validation: (rule) => rule.required().error('Choose a category for this card')
    }),
    defineField({
      name: 'letter',
      type: 'string',
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(1)
          .regex(/^[A-Z]$/i, {
            name: 'single letter',
            invert: false
          })
          .error('Provide a single letter (A–Z) for the card')
    }),
    defineField({
      name: 'color',
      type: 'string',
      description: 'Hex value used for the card accent color',
      validation: (rule) => rule.regex(/^#([0-9a-f]{3}){1,2}$/i, { name: 'hex color' })
    }),
    defineField({
      name: 'description',
      type: 'text'
    }),
    defineField({
      name: 'prompt',
      type: 'text'
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{ type: 'string' }]
    }),
    defineField({
      name: 'sources',
      type: 'array',
      of: [{ type: 'url' }]
    }),
    defineField({
      name: 'readingList',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'reading',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'url', type: 'url' })
          ]
        }
      ]
    }),
    defineField({
      name: 'exampleUse',
      title: 'Example Use',
      type: 'array',
      of: [{ type: 'text' }]
    }),
    defineField({
      name: 'postId',
      title: 'Post ID',
      type: 'string',
      readOnly: true,
      initialValue: (document) => document._id
    })
  ]
});
