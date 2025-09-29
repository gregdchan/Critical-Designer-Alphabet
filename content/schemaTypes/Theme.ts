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
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'palette',
      title: 'Color Palette',
      type: 'object',
      fields: [
        defineField({
          name: 'bg',
          title: 'Background Color',
          type: 'string',
          description: 'Main background color (hex)',
          validation: (rule) => rule.regex(/^#([0-9a-f]{3}){1,2}$/i, { name: 'hex color' })
        }),
        defineField({
          name: 'neonPink',
          title: 'Neon Pink',
          type: 'string',
          description: 'Neon pink accent color (hex)',
          validation: (rule) => rule.regex(/^#([0-9a-f]{3}){1,2}$/i, { name: 'hex color' }),
          initialValue: '#ff00ff'
        }),
        defineField({
          name: 'neonCyan',
          title: 'Neon Cyan',
          type: 'string',
          description: 'Neon cyan accent color (hex)',
          validation: (rule) => rule.regex(/^#([0-9a-f]{3}){1,2}$/i, { name: 'hex color' }),
          initialValue: '#00ffff'
        }),
        defineField({
          name: 'neonLime',
          title: 'Neon Lime',
          type: 'string',
          description: 'Neon lime accent color (hex)',
          validation: (rule) => rule.regex(/^#([0-9a-f]{3}){1,2}$/i, { name: 'hex color' }),
          initialValue: '#39ff14'
        }),
        defineField({
          name: 'retroPurple',
          title: 'Retro Purple',
          type: 'string',
          description: 'Retro purple accent color (hex)',
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
          description: 'Font family for headings and display text',
          initialValue: 'Press Start 2P'
        }),
        defineField({
          name: 'body',
          title: 'Body Font',
          type: 'string',
          description: 'Font family for body text',
          initialValue: 'Orbitron'
        })
      ]
    }),
    defineField({
      name: 'cardStyle',
      title: 'Card Styling',
      type: 'object',
      fields: [
        defineField({
          name: 'borderGlow',
          title: 'Border Glow Effect',
          type: 'boolean',
          description: 'Enable glowing border effect on cards',
          initialValue: true
        }),
        defineField({
          name: 'animation',
          title: 'Animation Style',
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
    prepare(selection) {
      const { title, subtitle } = selection;
      return {
        title,
        subtitle: subtitle ? `Background: ${subtitle}` : ''
      };
    }
  }
});