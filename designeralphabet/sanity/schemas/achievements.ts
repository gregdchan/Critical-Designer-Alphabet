import { defineType, defineField } from 'sanity';

export const achievements = defineType({
	name: 'achievements',
	title: 'Achievement',
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
			name: 'icon',
			title: 'Icon',
			type: 'string',
			description: 'Lucide icon name or custom sprite ID used in the arcade UI.'
		}),
		defineField({
			name: 'description',
			title: 'Description',
			type: 'text',
			rows: 4,
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'triggerCondition',
			title: 'Trigger Condition',
			type: 'text',
			rows: 4,
			description: 'Describe how facilitators award this badge or when auto-trigger kicks in.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'points',
			title: 'Points Awarded',
			type: 'number',
			initialValue: 50,
			validation: (Rule) => Rule.min(0).max(500)
		}),
		defineField({
			name: 'rarity',
			title: 'Rarity',
			type: 'string',
			options: {
				list: [
					{ title: 'Common', value: 'common' },
					{ title: 'Rare', value: 'rare' },
					{ title: 'Epic', value: 'epic' },
					{ title: 'Legendary', value: 'legendary' }
				],
				layout: 'radio'
			},
			initialValue: 'rare'
		})
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'triggerCondition'
		}
	}
});
