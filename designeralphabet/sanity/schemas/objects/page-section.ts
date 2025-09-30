import { defineType, defineField } from 'sanity';

export const pageSection = defineType({
	name: 'pageSection',
	title: 'Page Section',
	type: 'object',
	fields: [
		defineField({ name: 'title', title: 'Section Title', type: 'string' }),
		defineField({
			name: 'eyebrow',
			title: 'Eyebrow',
			type: 'string',
			description: 'Optional short label that sits above the section title.'
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'array',
			of: [{ type: 'block' }],
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'media',
			title: 'Media',
			type: 'image',
			options: { hotspot: true }
		}),
		defineField({
			name: 'accentColor',
			title: 'Accent Color',
			type: 'string',
			description: 'Hex or HSL color to tint neon borders.'
		})
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'eyebrow'
		}
	}
});
