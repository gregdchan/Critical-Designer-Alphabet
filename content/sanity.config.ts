import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {dashboardTool} from './plugins/dashboardTool'

export default defineConfig({
  name: 'default',
  title: 'designeralphabet',

  projectId: 'pctfp1xq',
  dataset: 'production',

  plugins: [structureTool(), visionTool(), dashboardTool()],

  schema: {
    types: schemaTypes,
  },
})
