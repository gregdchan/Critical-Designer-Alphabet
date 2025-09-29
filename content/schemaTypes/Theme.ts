import { defineField, defineType } from 'sanity';

export const Theme = defineType({
  name: 'theme',
  title: 'Theme',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Theme Name',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'palette',
      title: 'Color Palette',
      type: 'object',
      fields: [
        defineField({
          name: 'bg',
          title: 'Background',
          type: 'string',
          validation: (rule) => rule.regex(/^#([0-9a-f]{3}){1,2}$/i, { name: 'hex color' }),
          initialValue: '#05070f'
        }),
        defineField({
          name: 'surface',
          title: 'Surface',
          type: 'string',
          description: 'Card and panel background color.',
          validation: (rule) => rule.regex(/^#([0-9a-f]{3}){1,2}$/i, { name: 'hex color' }),
          initialValue: '#101427'
        }),
        defineField({
          name: 'neonPink',
          title: 'Neon Pink',
          type: 'string',
          validation: (rule) => rule.regex(/^#([0-9a-f]{3}){1,2}$/i, { name: 'hex color' }),
          initialValue: '#ff00ff'
        }),
        defineField({
          name: 'neonCyan',
          title: 'Neon Cyan',
          type: 'string',
          validation: (rule) => rule.regex(/^#([0-9a-f]{3}){1,2}$/i, { name: 'hex color' }),
          initialValue: '#00ffff'
        }),
        defineField({
          name: 'neonLime',
          title: 'Neon Lime',
          type: 'string',
          validation: (rule) => rule.regex(/^#([0-9a-f]{3}){1,2}$/i, { name: 'hex color' }),
          initialValue: '#39ff14'
        }),
        defineField({
          name: 'retroPurple',
          title: 'Retro Purple',
          type: 'string',
          validation: (rule) => rule.regex(/^#([0-9a-f]{3}){1,2}$/i, { name: 'hex color' }),
          initialValue: '#8a2be2'
        })
      ]
    }),
    defineField({
      name: 'fonts',
      title: 'Typography',
      type: 'object',
      fields: [
        defineField({
          name: 'display',
          title: 'Display Font',
          type: 'string',
          initialValue: 'Press Start 2P'
        }),
        defineField({
          name: 'body',
          title: 'Body Font',
          type: 'string',
          initialValue: 'Orbitron'
        })
      ]
    }),
    defineField({
      name: 'cardStyle',
      title: 'Card Style',
      type: 'object',
      fields: [
        defineField({
          name: 'borderGlow',
          type: 'boolean',
          initialValue: true
        }),
        defineField({
          name: 'animation',
          type: 'string',
          options: {
            list: [
              { title: 'Pulse', value: 'pulse' },
              { title: 'Glow', value: 'glow' },
              { title: 'Float', value: 'float' },
              { title: 'None', value: 'none' }
            ]
          },
          initialValue: 'glow'
        })
      ]
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'palette.bg'
    },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: subtitle ? `Background: ${subtitle}` : undefined
      };
    }
  }
});
