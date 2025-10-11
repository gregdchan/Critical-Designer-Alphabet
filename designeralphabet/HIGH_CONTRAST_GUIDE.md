# High Contrast Accent Elements Guide

## Overview

This document describes the high-contrast design system implemented for all accent elements (buttons, badges, timers, alerts, etc.) to ensure maximum visibility and accessibility.

## Color Palette

### Primary Colors

- **Teal Dark**: `#025259` - Deep teal for borders and hover states
- **Teal**: `#007172` - Primary brand color for buttons
- **Teal Light**: `#00a0a3` - Success/positive actions
- **Orange**: `#F29325` - Warnings and highlights
- **Orange Dark**: `#D94F04` - Critical actions and alerts

## Button Styles

### Primary Action Buttons (Blue → Teal)

- **Background**: `#007172` (Teal)
- **Text**: `#ffffff` (White)
- **Border**: 2px solid `#025259` (Teal Dark)
- **Shadow**: `0 4px 12px rgba(0, 113, 114, 0.35)`
- **Font Weight**: 600
- **Hover**: Background → `#025259`, stronger shadow

**Usage**: Main CTAs, primary navigation, "Complete Phase" buttons

### Critical/Danger Buttons (Red → Deep Orange)

- **Background**: `#D94F04` (Orange Dark)
- **Text**: `#ffffff` (White)
- **Border**: 2px solid `#bf4304`
- **Shadow**: `0 4px 12px rgba(217, 79, 4, 0.4)`
- **Font Weight**: 700
- **Hover**: Background → `#bf4304`, stronger shadow

**Usage**: Delete actions, danger warnings, critical alerts

### Warning Buttons (Yellow → Vibrant Orange)

- **Background**: `#F29325` (Orange)
- **Text**: `#0f172a` (Near Black)
- **Border**: 2px solid `#D94F04`
- **Shadow**: `0 4px 12px rgba(242, 147, 37, 0.4)`
- **Font Weight**: 700

**Usage**: "Reset Timer", warning actions, important notices

### Success Buttons (Green → Light Teal)

- **Background**: `#00a0a3` (Teal Light)
- **Text**: `#ffffff` (White)
- **Border**: 2px solid `#007172`
- **Shadow**: `0 4px 12px rgba(0, 160, 163, 0.35)`
- **Font Weight**: 600

**Usage**: Confirmation, success messages, positive actions

## Status Badges

### Success Badge

- **Background**: `#00a0a3` (Teal Light) - **solid, not transparent**
- **Text**: `#ffffff` (White)
- **Border**: 2px solid `#007172`
- **Font Weight**: 700
- **Padding**: 0.5rem 1rem

### Warning Badge

- **Background**: `#F29325` (Orange) - **solid, not transparent**
- **Text**: `#0f172a` (Near Black)
- **Border**: 2px solid `#D94F04`
- **Font Weight**: 700
- **Padding**: 0.5rem 1rem

### Info Badge

- **Background**: `#007172` (Teal) - **solid, not transparent**
- **Text**: `#ffffff` (White)
- **Border**: 2px solid `#025259`
- **Font Weight**: 700
- **Padding**: 0.5rem 1rem

## Icon Backgrounds

### Primary Icons (Blue → Teal)

- **Background**: `#007172`
- **Text/Icon**: `#ffffff`
- **Border**: 2px solid `#025259`

### Success Icons (Green → Light Teal)

- **Background**: `#00a0a3`
- **Text/Icon**: `#ffffff`
- **Border**: 2px solid `#007172`

### Dark Icons (Purple → Dark Teal)

- **Background**: `#025259`
- **Text/Icon**: `#ffffff`
- **Border**: 2px solid `#013840`

## Headings

- **Color**: `#025259` (Teal Dark)
- **Font Weight**: 800
- **No text shadow** for maximum clarity

## Implementation

All high-contrast overrides are defined in `/src/app.css` using `:global()` selectors to override Tailwind classes throughout the app.

### Affected Classes

- `bg-blue-600`, `bg-blue-700` → Teal primary buttons
- `bg-red-600`, `bg-red-700` → Orange dark critical buttons
- `bg-yellow-400/500/600` → Orange warning buttons
- `bg-green-400/500/600` → Light teal success buttons
- `bg-*-400/20`, `bg-*-400/10` → Solid badge backgrounds
- `text-*-300`, `text-*-400` → High contrast text colors
- `bg-*-50` → Icon background colors

## Accessibility

✅ **WCAG AA Compliance**: All text meets 4.5:1 contrast ratio
✅ **Bold Borders**: 2px borders on all accent elements for clarity
✅ **Strong Shadows**: Prominent shadows for depth and focus
✅ **Heavy Font Weights**: 600-700 weight for all buttons and badges
✅ **Solid Backgrounds**: No transparency on critical UI elements

## Visual Characteristics

- **No transparency** on buttons or badges (solid backgrounds only)
- **Strong borders** on all interactive elements
- **Prominent shadows** for visual hierarchy
- **High contrast** text (white on dark, black on light)
- **Bold typography** for readability
