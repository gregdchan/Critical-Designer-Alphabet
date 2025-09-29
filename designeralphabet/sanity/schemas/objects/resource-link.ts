import { defineType, defineField } from 'sanity';

export const resourceLink = defineType({
  name: 'resourceLink',
  title: 'Resource Link',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(120)
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.uri({ allowRelative: false, scheme: ['http', 'https'] })
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'url'
    }
  }
});
