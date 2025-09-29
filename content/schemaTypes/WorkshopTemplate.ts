import { defineField, defineType } from 'sanity';

export const WorkshopTemplate = defineType({
  name: 'workshopTemplate',
  title: 'Workshop Template',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'description',
      type: 'text',
      description: 'Brief description of the workshop template'
    }),
    defineField({
      name: 'lenses',
      title: 'Design Lenses',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Available lenses for this workshop (e.g., Risk, Work, Sustainability, Ethics)',
      initialValue: ['Risk', 'Work', 'Sustainability', 'Ethics']
    }),
    defineField({
      name: 'steps',
      title: 'Workshop Steps',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'step',
          fields: [
            defineField({
              name: 'key',
              type: 'string',
              validation: (rule) => rule.required()
            }),
            defineField({
              name: 'name',
              type: 'string',
              validation: (rule) => rule.required()
            }),
            defineField({
              name: 'minutes',
              type: 'number',
              validation: (rule) => rule.required().min(1)
            }),
            defineField({
              name: 'instructions',
              type: 'text',
              validation: (rule) => rule.required()
            })
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'minutes'
            },
            prepare(selection) {
              const { title, subtitle } = selection;
              return {
                title,
                subtitle: `${subtitle} minutes`
              };
            }
          }
        }
      ]
    }),
    defineField({
      name: 'scoring',
      title: 'Scoring Configuration',
      type: 'object',
      fields: [
        defineField({
          name: 'idea',
          title: 'Points per Idea',
          type: 'number',
          initialValue: 2
        }),
        defineField({
          name: 'vote',
          title: 'Points per Vote Received',
          type: 'number',
          initialValue: 1
        }),
        defineField({
          name: 'reflection',
          title: 'Points per Reflection',
          type: 'number',
          initialValue: 5
        }),
        defineField({
          name: 'fairnessThreshold',
          title: 'Card Link Threshold for Bonus',
          type: 'number',
          description: 'Minimum linked cards required for bonus points',
          initialValue: 2
        })
      ]
    }),
    defineField({
      name: 'charts',
      title: 'Available Charts',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Charts to display in this workshop',
      options: {
        list: [
          { title: 'Quad Bubble', value: 'quadBubble' },
          { title: 'Maturity Heatmap', value: 'maturityHeatmap' },
          { title: 'Roadmap Swimlanes', value: 'roadmapSwimlanes' },
          { title: 'Leaderboard', value: 'leaderboard' }
        ]
      },
      initialValue: ['quadBubble', 'maturityHeatmap', 'roadmapSwimlanes', 'leaderboard']
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      type: 'reference',
      to: [{ type: 'theme' }]
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description'
    }
  }
});