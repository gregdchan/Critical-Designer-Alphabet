import { defineType, defineField } from 'sanity';

export const i18nText = defineType({
	name: 'i18nText',
	title: 'Localized Text',
	type: 'object',
	options: {
		collapsible: true,
		collapsed: true
	},
	fields: [
		defineField({
			name: 'en',
			title: 'English',
			type: 'text',
			rows: 3
		}),
		defineField({
			name: 'es',
			title: 'Spanish',
			type: 'text',
			rows: 3
		}),
		defineField({
			name: 'fr',
			title: 'French',
			type: 'text',
			rows: 3
		}),
		defineField({
			name: 'pt',
			title: 'Portuguese',
			type: 'text',
			rows: 3
		})
	]
});
