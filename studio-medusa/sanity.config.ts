import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schema} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'medusa',

  projectId: '45wtqzcz',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: schema
})
