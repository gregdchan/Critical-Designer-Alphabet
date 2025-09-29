import { defineType, defineField } from 'sanity';

export const pages = defineType({
  name: 'pages',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Short label displayed above the hero title.'
    }),
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'array',
      of: [{ type: 'block' }]
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [{ type: 'pageSection' }]
    }),
    defineField({
      name: 'cta',
      title: 'Call To Action',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string' }),
        defineField({ name: 'href', title: 'Link', type: 'url' })
      ]
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'metaTitle', title: 'Meta Title', type: 'string' }),
        defineField({ name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 3 })
      ]
    }),
    defineField({
      name: 'localizedHeroSubtitle',
      title: 'Hero Subtitle (Localized)',
      type: 'i18nText'
    }),
    defineField({
      name: 'localizedSummary',
      title: 'Summary (Localized)',
      type: 'i18nText'
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current'
    }
  }
});
