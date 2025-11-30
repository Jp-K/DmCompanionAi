'use client';

import React from 'react';
import { PlateLeaf, type PlateLeafProps } from 'platejs/react';

// ============================================
// BOLD LEAF
// ============================================

export function BoldLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      as="strong"
      style={{
        fontWeight: 700,
        color: '#1A0F0A',
      }}
      {...props}
    />
  );
}

// ============================================
// ITALIC LEAF
// ============================================

export function ItalicLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      as="em"
      style={{
        fontStyle: 'italic',
      }}
      {...props}
    />
  );
}

// ============================================
// UNDERLINE LEAF
// ============================================

export function UnderlineLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      as="u"
      style={{
        textDecoration: 'underline',
        textDecorationColor: '#1A0F0A',
      }}
      {...props}
    />
  );
}

// ============================================
// STRIKETHROUGH LEAF
// ============================================

export function StrikethroughLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      as="s"
      style={{
        textDecoration: 'line-through',
        opacity: 0.7,
      }}
      {...props}
    />
  );
}

// ============================================
// CODE LEAF (inline code)
// ============================================

export function CodeLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      as="code"
      style={{
        fontFamily: "'Fira Code', 'Monaco', monospace",
        fontSize: '0.875em',
        backgroundColor: 'rgba(26, 15, 10, 0.2)',
        color: '#1A0F0A',
        padding: '2px 6px',
        borderRadius: '4px',
        border: '1px solid rgba(26, 15, 10, 0.3)',
      }}
      {...props}
    />
  );
}

// ============================================
// HIGHLIGHT LEAF
// ============================================

export function HighlightLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      as="mark"
      style={{
        backgroundColor: 'rgba(26, 15, 10, 0.4)',
        color: '#1A0F0A',
        padding: '1px 4px',
        borderRadius: '2px',
      }}
      {...props}
    />
  );
}

// ============================================
// SUBSCRIPT LEAF
// ============================================

export function SubscriptLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      as="sub"
      style={{
        fontSize: '0.75em',
        verticalAlign: 'sub',
      }}
      {...props}
    />
  );
}

// ============================================
// SUPERSCRIPT LEAF
// ============================================

export function SuperscriptLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      as="sup"
      style={{
        fontSize: '0.75em',
        verticalAlign: 'super',
      }}
      {...props}
    />
  );
}

// ============================================
// KEYBOARD LEAF (kbd)
// ============================================

export function KbdLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      as="kbd"
      style={{
        fontFamily: "'Fira Code', 'Monaco', monospace",
        fontSize: '0.85em',
        backgroundColor: '#1A0F0A',
        color: '#1A0F0A',
        padding: '2px 6px',
        borderRadius: '4px',
        border: '1px solid #1A0F0A',
        boxShadow: '0 2px 0 #1A0F0A',
      }}
      {...props}
    />
  );
}
