import { defineField } from 'sanity';

export const sessionQuestion = defineField({
  name: 'sessionQuestion',
  title: 'Session Question',
  type: 'object',
  fields: [
    defineField({
      name: 'prompt',
      type: 'text',
      title: 'Prompt',
      rows: 3,
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'lens',
      type: 'string',
      title: 'Lens / Theme',
      description: 'Optional category to group responses (e.g., Risk, Ethics).'
    }),
    defineField({
      name: 'responseType',
      type: 'string',
      title: 'Response Type',
      initialValue: 'written',
      validation: (rule) => rule.required(),
      options: {
        layout: 'radio',
        list: [
          { title: 'Written response (text + voting)', value: 'written' },
          { title: 'Single choice (pick one option)', value: 'singleChoice' },
          { title: 'Multi select (pick multiple)', value: 'multiSelect' },
          { title: 'Scale / slider (numeric 0-10)', value: 'scale' },
          { title: '2D Landscape (position on X/Y axes)', value: 'landscape' }
        ]
      }
    }),
    defineField({
      name: 'options',
      type: 'array',
      title: 'Options',
      description: 'Choices for single or multi select responses.',
      of: [{ type: 'string' }],
      hidden: ({ parent }) => !['singleChoice', 'multiSelect'].includes(parent?.responseType ?? '')
    }),
    defineField({
      name: 'scale',
      type: 'object',
      title: 'Scale Settings',
      hidden: ({ parent }) => parent?.responseType !== 'scale',
      fields: [
        defineField({ name: 'min', type: 'number', initialValue: 0, validation: (rule) => rule.required() }),
        defineField({ name: 'max', type: 'number', initialValue: 10, validation: (rule) => rule.required().min(1) }),
        defineField({ name: 'minLabel', type: 'string', title: 'Low label' }),
        defineField({ name: 'maxLabel', type: 'string', title: 'High label' })
      ]
    }),
    defineField({
      name: 'landscape',
      type: 'object',
      title: 'Response Landscape Settings',
      hidden: ({ parent }) => parent?.responseType !== 'landscape',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = (context?.parent as { responseType?: string } | undefined) ?? undefined;
          const isLandscape = parent?.responseType === 'landscape';
          if (!isLandscape) {
            return true;
          }

          if (!value) {
            return 'Landscape settings are required when using landscape response type.';
          }

          if (!value.xLabel || !value.yLabel) {
            return 'Please provide both X and Y axis labels.';
          }

          return true;
        }),
      fields: [
        defineField({ name: 'xLabel', type: 'string', title: 'X Axis Label' }),
        defineField({ name: 'yLabel', type: 'string', title: 'Y Axis Label' }),
        defineField({ name: 'minX', type: 'number', initialValue: 0 }),
        defineField({ name: 'maxX', type: 'number', initialValue: 10 }),
        defineField({ name: 'minY', type: 'number', initialValue: 0 }),
        defineField({ name: 'maxY', type: 'number', initialValue: 10 }),
        defineField({ name: 'xPrompt', type: 'string', title: 'X Axis Prompt', description: 'Question asked to determine the X value.' }),
        defineField({ name: 'yPrompt', type: 'string', title: 'Y Axis Prompt', description: 'Question asked to determine the Y value.' })
      ]
    }),
    defineField({
      name: 'enableVoting',
      type: 'boolean',
      title: 'Enable Voting',
      description: 'Allow participants to vote on responses to prioritize ideas',
      initialValue: true,
      hidden: ({ parent }) => {
        const mapType = parent?.mapType;
        const responseType = parent?.responseType;

        // Auto-disable and hide for response landscapes (positioning shows priority)
        if (mapType === 'response-landscape') return true;

        // Auto-disable and hide for scale responses (distribution is the insight)
        if (responseType === 'scale') return true;

        // Show the toggle for everything else
        return false;
      }
    }),
    defineField({
      name: 'dashboards',
      type: 'array',
      title: 'Recommended Dashboards',
      description: 'Select which visualizations to show for this question (options filtered by response type)',
      of: [
        {
          type: 'string',
          options: {
            list: (context: any) => {
              // Access parent from context.parent which gives us the sessionQuestion object
              const responseType = context?.parent?.responseType || 'written';
              const allDashboards = [
                { title: 'Overview (always available)', value: 'overview' },
                { title: 'Heatmap (lens clustering)', value: 'heatmap' },
                { title: 'Roadmap (priority by votes)', value: 'roadmap' },
                { title: 'Quad Bubbles (similarity clusters)', value: 'quadBubbles' },
                { title: 'Response Landscape (2D positioning)', value: 'response-landscape' },
                { title: 'Timeline (always available)', value: 'timeline' },
                { title: 'Leaderboard (participation)', value: 'leaderboard' },
                { title: 'Chat (always available)', value: 'chat' }
              ];

              // Filter based on response type compatibility
              if (responseType === 'written') {
                return allDashboards.filter(d =>
                  ['overview', 'heatmap', 'roadmap', 'quadBubbles', 'timeline', 'leaderboard', 'chat'].includes(d.value)
                );
              } else if (responseType === 'landscape') {
                return allDashboards.filter(d =>
                  ['overview', 'response-landscape', 'timeline', 'leaderboard', 'chat'].includes(d.value)
                );
              } else if (responseType === 'scale') {
                return allDashboards.filter(d =>
                  ['overview', 'timeline', 'leaderboard', 'chat'].includes(d.value)
                );
              } else if (responseType === 'multiSelect' || responseType === 'singleChoice') {
                return allDashboards.filter(d =>
                  ['overview', 'heatmap', 'timeline', 'leaderboard', 'chat'].includes(d.value)
                );
              }

              return allDashboards;
            }
          }
        }
      ],
      options: {
        layout: 'dropdown'
      }
    })
  ],
  preview: {
    select: {
      title: 'prompt',
      subtitle: 'responseType'
    },
    prepare({ title, subtitle }) {
      return {
        title: title ? title.slice(0, 80) + (title.length > 80 ? '…' : '') : 'Question',
        subtitle: subtitle ? `Response: ${subtitle}` : 'Response: written'
      };
    }
  }
});
