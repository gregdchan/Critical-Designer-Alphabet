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
          { title: 'Written response', value: 'written' },
          { title: 'Single choice', value: 'singleChoice' },
          { title: 'Multi select', value: 'multiSelect' },
          { title: 'Scale / slider', value: 'scale' }
        ]
      }
    }),
    defineField({
      name: 'mapType',
      type: 'string',
      title: 'Map or Dashboard',
      initialValue: 'responses',
      options: {
        layout: 'radio',
        list: [
          { title: 'Responses Board', value: 'responses' },
          { title: 'Response Landscape', value: 'response-landscape' },
          { title: 'Heatmap', value: 'heatmap' },
          { title: 'Roadmap Swimlanes', value: 'roadmap' },
          { title: 'Timeline', value: 'timeline' },
          { title: 'Chat Feed', value: 'chat' }
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
      hidden: ({ parent }) => parent?.mapType !== 'response-landscape',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = (context?.parent as { mapType?: string } | undefined) ?? undefined;
          const isLandscape = parent?.mapType === 'response-landscape';
          if (!isLandscape) {
            return true;
          }

          if (!value) {
            return 'Landscape settings are required when using the Response Landscape map.';
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
      name: 'recommendedDashboards',
      type: 'array',
      title: 'Recommended Dashboards',
      of: [{ type: 'string' }],
      description: 'Overrides default dashboards for phases referencing this question.'
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
