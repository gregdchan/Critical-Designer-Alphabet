import React from 'react'
import {definePlugin} from 'sanity'
import {CogIcon} from '@sanity/icons'

function DashboardToolComponent() {
  return (
    <div style={{padding: 24}}>
      <h1 style={{margin: 0, fontSize: 24}}>Dashboard</h1>
      <p style={{marginTop: 12, lineHeight: 1.6}}>
        A dedicated Sanity dashboard tool is not configured yet. Use the Desk tool to
        manage content, or open your app’s dashboards separately.
      </p>
      <p style={{marginTop: 12}}>
        If you intended to open your web app dashboard, visit the app route
        <code style={{marginLeft: 6}}>/dashboard</code> in your frontend.
      </p>
    </div>
  )
}

export const dashboardTool = definePlugin({
  name: 'dashboard-tool',
  tools: (prev) =>
    prev.concat({
      name: 'dashboard',
      title: 'Dashboard',
      icon: CogIcon,
      component: DashboardToolComponent,
    }),
})

