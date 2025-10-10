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
      title: 'Critical Design Lens',
      description: 'Category to group responses by design perspective.',
      options: {
        list: [
          { title: 'Risk', value: 'Risk' },
          { title: 'Work', value: 'Work' },
          { title: 'Sustainability', value: 'Sustainability' },
          { title: 'Ethics', value: 'Ethics' },
          { title: 'Justice', value: 'Justice' },
          { title: 'Culture', value: 'Culture' },
          { title: 'Innovation', value: 'Innovation' },
          { title: 'Governance', value: 'Governance' },
          { title: 'Community', value: 'Community' },
          { title: 'Agency', value: 'Agency' }
        ],
        layout: 'dropdown'
      }
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
          { title: '2D Landscape (position on X/Y axes)', value: 'landscape' },
          { title: 'Risk Assessment (impact + likelihood)', value: 'riskAssessment' },
          { title: 'Maturity Dial (5-level assessment)', value: 'maturityDial' },
          { title: 'Inclusivity Meter (progress gauge)', value: 'inclusivityMeter' }
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
      name: 'riskMatrix',
      type: 'object',
      title: 'Risk Assessment Settings',
      hidden: ({ parent }) => parent?.responseType !== 'riskAssessment',
      fields: [
        defineField({
          name: 'impactLabel',
          type: 'string',
          title: 'Impact Axis Label',
          initialValue: 'Impact',
          validation: (rule) => rule.required()
        }),
        defineField({
          name: 'likelihoodLabel',
          type: 'string',
          title: 'Likelihood Axis Label',
          initialValue: 'Likelihood',
          validation: (rule) => rule.required()
        }),
        defineField({
          name: 'impactPrompt',
          type: 'text',
          title: 'Impact Question',
          description: 'Ask participants to rate the impact (1-5)',
          placeholder: 'How severe would this risk be? (1=minimal, 5=critical)',
          rows: 2
        }),
        defineField({
          name: 'likelihoodPrompt',
          type: 'text',
          title: 'Likelihood Question',
          description: 'Ask participants to rate the likelihood (1-5)',
          placeholder: 'How likely is this to occur? (1=rare, 5=certain)',
          rows: 2
        })
      ]
    }),
    defineField({
      name: 'maturityDial',
      type: 'object',
      title: 'Maturity Dial Settings',
      hidden: ({ parent }) => parent?.responseType !== 'maturityDial',
      fields: [
        defineField({
          name: 'dimension',
          type: 'string',
          title: 'What is being assessed?',
          description: 'e.g., "Design Thinking Maturity", "Inclusive Practice", "Sustainability Integration"',
          placeholder: 'Design Practice Maturity'
        }),
        defineField({
          name: 'stages',
          type: 'array',
          title: 'Maturity Stages',
          description: 'Define the 5 levels of maturity (leave default for standard model)',
          of: [{
            type: 'object',
            fields: [
              defineField({ name: 'level', type: 'number', title: 'Level', validation: (rule) => rule.min(1).max(5).required() }),
              defineField({ name: 'name', type: 'string', title: 'Stage Name', validation: (rule) => rule.required() }),
              defineField({ name: 'description', type: 'string', title: 'Description' })
            ],
            preview: {
              select: { level: 'level', name: 'name', description: 'description' },
              prepare({ level, name, description }) {
                return {
                  title: `Level ${level}: ${name}`,
                  subtitle: description
                };
              }
            }
          }],
          initialValue: [
            { level: 1, name: 'Foundational', description: 'Basic awareness and early exploration' },
            { level: 2, name: 'Developing', description: 'Early adoption and experimentation' },
            { level: 3, name: 'Proficient', description: 'Regular practice and integration' },
            { level: 4, name: 'Advanced', description: 'Strategic integration and optimization' },
            { level: 5, name: 'Aspirational', description: 'Innovation leadership and best practice' }
          ]
        })
      ]
    }),
    defineField({
      name: 'inclusivityMeter',
      type: 'object',
      title: 'Inclusivity Meter Settings',
      hidden: ({ parent }) => parent?.responseType !== 'inclusivityMeter',
      fields: [
        defineField({
          name: 'dimension',
          type: 'string',
          title: 'What aspect of inclusivity?',
          description: 'e.g., "Accessibility", "Cultural Representation", "Diverse Perspectives"',
          placeholder: 'Overall Inclusivity'
        }),
        defineField({
          name: 'lowLabel',
          type: 'string',
          title: 'Low End Label',
          initialValue: 'Needs Improvement'
        }),
        defineField({
          name: 'highLabel',
          type: 'string',
          title: 'High End Label',
          initialValue: 'Highly Inclusive'
        }),
        defineField({
          name: 'targetScore',
          type: 'number',
          title: 'Target Score (optional)',
          description: 'Goal score to visualize as a target line (0-100)',
          validation: (rule) => rule.min(0).max(100)
        })
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
      name: 'recommendedDashboards',
      type: 'array',
      title: 'Dashboards to Display',
      description: `Select which visualizations to show for this question. Defaults are automatically set based on response type.
      • Written: Heatmap, Word Cloud
      • Landscape (2D): Response Landscape
      • Scale: Line Chart
      • Single/Multi Choice: Bar Chart (add Pie Chart if desired)
      • Risk Assessment: Risk Impact Matrix
      • Maturity Dial: Maturity Dial
      • Inclusivity Meter: Inclusivity Meter`,
      initialValue: (context: any) => {
        const parent = context?.parent;
        const responseType = parent?.responseType || 'written';
        switch (responseType) {
          case 'singleChoice':
          case 'multiSelect':
            return ['barChart']; // Default to barChart only, add pieChart manually if needed
          case 'scale':
            return ['lineChart'];
          case 'landscape':
            return ['response-landscape'];
          case 'riskAssessment':
            return ['riskImpactMatrix'];
          case 'maturityDial':
            return ['maturityDial'];
          case 'inclusivityMeter':
            return ['inclusivityMeter'];
          case 'written':
          default:
            return ['heatmap', 'wordcloud'];
        }
      },
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'Overview (works with all types)', value: 'overview' },
              { title: 'Bar Chart (choice responses only)', value: 'barChart' },
              { title: 'Pie Chart (choice responses only)', value: 'pieChart' },
              { title: 'Line Chart (scale/slider responses only)', value: 'lineChart' },
              { title: 'Heatmap (requires written or choice responses)', value: 'heatmap' },
              { title: 'Roadmap (requires written responses + voting)', value: 'roadmap' },
              { title: 'Quad Bubbles (requires written responses)', value: 'quadBubbles' },
              { title: 'Word Cloud (requires written responses + voting)', value: 'wordcloud' },
              { title: 'Response Landscape (requires 2D positioning)', value: 'response-landscape' },
              { title: 'Risk Impact Matrix (requires risk assessment)', value: 'riskImpactMatrix' },
              { title: 'Maturity Dial (requires maturity assessment)', value: 'maturityDial' },
              { title: 'Inclusivity Meter (requires inclusivity assessment)', value: 'inclusivityMeter' },
              { title: 'Timeline (works with all types)', value: 'timeline' },
              { title: 'Leaderboard (works with all types)', value: 'leaderboard' },
              { title: 'Chat (works with all types)', value: 'chat' }
            ]
          }
        }
      ],
      validation: (rule) =>
        rule.custom((dashboards, context) => {
          const parent = context?.parent as { responseType?: string; enableVoting?: boolean } | undefined;
          const responseType = parent?.responseType || 'written';
          const selectedDashboards = (dashboards as string[]) || [];

          // Warn if incompatible dashboards are selected
          const warnings: string[] = [];

          if (selectedDashboards.includes('response-landscape') && responseType !== 'landscape') {
            warnings.push('⚠️ Response Landscape requires responseType = "landscape"');
          }

          if (selectedDashboards.includes('roadmap') && responseType !== 'written') {
            warnings.push('⚠️ Roadmap works best with written responses');
          }

          if (selectedDashboards.includes('quadBubbles') && responseType !== 'written') {
            warnings.push('⚠️ Quad Bubbles works best with written responses');
          }

          if (selectedDashboards.includes('wordcloud') && responseType !== 'written') {
            warnings.push('⚠️ Word Cloud works best with written responses');
          }

          if (selectedDashboards.includes('heatmap') && !['written', 'singleChoice', 'multiSelect'].includes(responseType)) {
            warnings.push('⚠️ Heatmap requires written or choice responses');
          }

          if (selectedDashboards.includes('barChart') && !['singleChoice', 'multiSelect'].includes(responseType)) {
            warnings.push('⚠️ Bar Chart requires singleChoice or multiSelect response type');
          }

          if (selectedDashboards.includes('pieChart') && !['singleChoice', 'multiSelect'].includes(responseType)) {
            warnings.push('⚠️ Pie Chart requires singleChoice or multiSelect response type');
          }

          if (selectedDashboards.includes('lineChart') && responseType !== 'scale') {
            warnings.push('⚠️ Line Chart requires scale response type');
          }

          if (selectedDashboards.includes('riskImpactMatrix') && responseType !== 'riskAssessment') {
            warnings.push('⚠️ Risk Impact Matrix requires riskAssessment response type');
          }

          if (selectedDashboards.includes('maturityDial') && responseType !== 'maturityDial') {
            warnings.push('⚠️ Maturity Dial requires maturityDial response type');
          }

          if (selectedDashboards.includes('inclusivityMeter') && responseType !== 'inclusivityMeter') {
            warnings.push('⚠️ Inclusivity Meter requires inclusivityMeter response type');
          }

          return warnings.length > 0 ? warnings.join('\n') : true;
        }),
      options: {
        layout: 'list'
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
