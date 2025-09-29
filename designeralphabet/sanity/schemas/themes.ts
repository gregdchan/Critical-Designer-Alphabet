import { defineType, defineField } from 'sanity';

export const themes = defineType({
  name: 'themes',
  title: 'Theme',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Theme Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(80)
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'palette',
      title: 'Palette (HSL)',
      type: 'object',
      fields: [
        defineField({ name: 'background', title: 'Background', type: 'string' }),
        defineField({ name: 'surface', title: 'Surface', type: 'string' }),
        defineField({ name: 'primary', title: 'Primary Accent', type: 'string' }),
        defineField({ name: 'secondary', title: 'Secondary Accent', type: 'string' }),
        defineField({ name: 'glow', title: 'Glow Accent', type: 'string' })
      ],
      validation: (Rule) => Rule.required(),
      options: {
        columns: 2
      }
    }),
    defineField({
      name: 'fonts',
      title: 'Font Stack',
      type: 'object',
      fields: [
        defineField({ name: 'display', title: 'Display Font', type: 'string' }),
        defineField({ name: 'body', title: 'Body Font', type: 'string' })
      ]
    }),
    defineField({
      name: 'accentStyles',
      title: 'Accent Styles',
      type: 'array',
      of: [
        defineField({
          name: 'accent',
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({ name: 'neon', title: 'Neon Color', type: 'string' }),
            defineField({ name: 'shadow', title: 'Glow Shadow', type: 'string' })
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'neon'
            }
          }
        })
      ]
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description'
    }
  }
});
