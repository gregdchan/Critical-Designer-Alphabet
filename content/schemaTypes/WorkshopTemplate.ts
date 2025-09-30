import { defineArrayMember, defineField, defineType } from 'sanity';

export const WorkshopTemplate = defineType({
  name: 'workshopTemplate',
  title: 'Workshop Template',
  type: 'document',
  groups: [
    { name: 'overview', title: 'Overview', default: true },
    { name: 'sections', title: 'Sections' },
    { name: 'facilitation', title: 'Facilitation' },
    { name: 'visuals', title: 'Visuals' },
    { name: 'ai', title: 'AI Assist' },
    { name: 'resources', title: 'Resources' }
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
      group: 'overview'
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
      group: 'overview'
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 4,
      group: 'overview'
    }),
    defineField({
      name: 'challenge',
      title: 'Challenge Statement',
      type: 'text',
      rows: 4,
      description: 'Describe the core challenge or opportunity this template addresses.',
      group: 'overview'
    }),
    defineField({
      name: 'lenses',
      type: 'array',
      of: [{ type: 'string' }],
      initialValue: ['Risk', 'Work', 'Sustainability', 'Ethics'],
      group: 'overview'
    }),
    defineField({
      name: 'sections',
      type: 'object',
      group: 'sections',
      fields: [
        defineField({
          name: 'onboarding',
          type: 'object',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'introCopy', type: 'text', rows: 4 }),
            defineField({
              name: 'whatToBring',
              title: 'What to Bring',
              type: 'array',
              of: [{ type: 'string' }]
            }),
            defineField({ name: 'rules', type: 'array', of: [{ type: 'string' }] }),
            defineField({ name: 'quickStart', type: 'array', of: [{ type: 'string' }] })
          ]
        }),
        defineField({
          name: 'breakout',
          type: 'object',
          fields: [
            defineField({
              name: 'rounds',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'round',
                  fields: [
                    defineField({ name: 'key', type: 'string', validation: (rule) => rule.required() }),
                    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
                    defineField({ name: 'minutes', type: 'number', validation: (rule) => rule.required().min(1) }),
                    defineField({
                      name: 'questions',
                      type: 'array',
                      of: [{ type: 'sessionQuestion' }],
                      description: 'Associate prompts with response types and dashboards for this breakout round.'
                    })
                  ],
                  preview: {
                    select: { title: 'name', subtitle: 'minutes' },
                    prepare({ title, subtitle }) {
                      return { title, subtitle: `${subtitle ?? ''} mins` };
                    }
                  }
                })
              ]
            })
          ]
        }),
        defineField({
          name: 'synthesis',
          type: 'object',
          fields: [
            defineField({
              name: 'methods',
              type: 'array',
              of: [{ type: 'string' }],
              options: {
                list: [
                  { title: 'Prioritize', value: 'prioritize' },
                  { title: 'Now-Next-Later', value: 'now-next-later' },
                  { title: 'Debrief Circle', value: 'debrief-circle' }
                ]
              },
              initialValue: ['prioritize', 'now-next-later']
            }),
            defineField({ name: 'instructions', type: 'text', rows: 4 })
          ]
        }),
        defineField({
          name: 'commitments',
          type: 'object',
          fields: [
            defineField({ name: 'instructions', type: 'text', rows: 4 }),
            defineField({
              name: 'exportFields',
              type: 'array',
              of: [{ type: 'string' }]
            })
          ]
        })
      ]
    }),
    defineField({
      name: 'phases',
      title: 'Session Phases',
      type: 'array',
      group: 'sections',
      description: 'Define the flow of the session. Each phase can include guidance and default dashboards.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'phase',
          fields: [
            defineField({
              name: 'key',
              type: 'string',
              validation: (rule) => rule.required(),
              description: 'Unique identifier, e.g. onboarding, breakout-1.'
            }),
            defineField({
              name: 'title',
              type: 'string',
              validation: (rule) => rule.required(),
              description: 'Displayed name for the phase.'
            }),
            defineField({
              name: 'description',
              type: 'text',
              rows: 3,
              description: 'Context or guidance for hosts and participants.'
            }),
            defineField({
              name: 'durationMinutes',
              title: 'Suggested Duration (minutes)',
              type: 'number',
              validation: (rule) => rule.min(1),
              description: 'Optional: used to pre-fill timers.'
            }),
            defineField({
              name: 'dashboards',
              type: 'array',
              of: [{ type: 'string' }],
              options: {
                list: [
                  { title: 'Responses Board', value: 'responses' },
                  { title: 'Heatmap', value: 'heatmap' },
                  { title: 'Roadmap', value: 'roadmap' },
                  { title: 'Timeline', value: 'timeline' },
                  { title: 'Leaderboard', value: 'leaderboard' },
                  { title: 'Chat Feed', value: 'chat' }
                ]
              },
              description: 'Controls which dashboards are highlighted during the phase.'
            })
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'durationMinutes'
            },
            prepare({ title, subtitle }) {
              return {
                title: title ?? 'Untitled phase',
                subtitle: subtitle ? `${subtitle} min` : undefined
              };
            }
          }
        })
      ]
    }),
    defineField({
      name: 'facilitation',
      type: 'object',
      group: 'facilitation',
      fields: [
        defineField({
          name: 'roles',
          type: 'array',
          of: [{ type: 'string' }],
          initialValue: ['facilitator', 'participant']
        }),
        defineField({
          name: 'fairnessThreshold',
          type: 'number',
          initialValue: 0.7
        }),
        defineField({
          name: 'scoring',
          type: 'object',
          fields: [
            defineField({ name: 'idea', type: 'number', initialValue: 2 }),
            defineField({ name: 'vote', type: 'number', initialValue: 1 }),
            defineField({ name: 'linkCards', type: 'number', initialValue: 3 }),
            defineField({ name: 'reflection', type: 'number', initialValue: 5 }),
            defineField({ name: 'justice', type: 'number', initialValue: 3 })
          ]
        }),
        defineField({
          name: 'badges',
          type: 'array',
          of: [{ type: 'string' }],
          initialValue: ['Bridge Builder', 'Reflective', 'Justice Seeker', 'Amplifier']
        })
      ]
    }),
    defineField({
      name: 'visuals',
      type: 'object',
      group: 'visuals',
      fields: [
        defineField({
          name: 'charts',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Quad Bubbles', value: 'quadBubbles' },
              { title: 'Maturity Heatmap', value: 'maturityHeatmap' },
              { title: 'Roadmap Swimlanes', value: 'roadmapSwimlanes' }
            ]
          }
        }),
        defineField({
          name: 'theme',
          type: 'reference',
          to: [{ type: 'theme' }]
        })
      ]
    }),
    defineField({
      name: 'aiAssist',
      title: 'AI Assist',
      type: 'object',
      group: 'ai',
      fields: [
        defineField({ name: 'enabled', type: 'boolean', initialValue: false }),
        defineField({
          name: 'maxAlternates',
          type: 'number',
          initialValue: 2,
          validation: (rule) => rule.min(0).max(2)
        }),
        defineField({ name: 'guidance', type: 'text', rows: 4 })
      ]
    }),
    defineField({
      name: 'resources',
      type: 'array',
      group: 'resources',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'resource',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'url', type: 'url' })
          ]
        })
      ]
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description'
    }
  }
});
