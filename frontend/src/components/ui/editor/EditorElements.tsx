'use client';

import React, { useState, useCallback } from 'react';
import { PlateElement, type PlateElementProps, useEditorRef } from 'platejs/react';
import { Transforms, Node, Path, Editor } from 'slate';

export function H1Element(props: PlateElementProps) {
  return (
    <PlateElement
      as="h1"
      style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        fontFamily: "'Cinzel', serif",
        color: '#1A0F0A',
        marginTop: '2rem',
        marginBottom: '0.5rem',
        lineHeight: 1.2,
      }}
      {...props}
    />
  );
}

export function H2Element(props: PlateElementProps) {
  return (
    <PlateElement
      as="h2"
      style={{
        fontSize: '1.875rem',
        fontWeight: 600,
        fontFamily: "'Cinzel', serif",
        color: '#1A0F0A',
        marginTop: '1.5rem',
        marginBottom: '0.5rem',
        lineHeight: 1.3,
      }}
      {...props}
    />
  );
}

export function H3Element(props: PlateElementProps) {
  return (
    <PlateElement
      as="h3"
      style={{
        fontSize: '1.5rem',
        fontWeight: 600,
        fontFamily: "'Cinzel', serif",
        color: '#1A0F0A',
        marginTop: '1rem',
        marginBottom: '0.5rem',
        lineHeight: 1.4,
      }}
      {...props}
    />
  );
}

// ============================================
// PARAGRAPH ELEMENT
// ============================================

export function ParagraphElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="p"
      style={{
        fontSize: '1rem',
        lineHeight: 1.75,
        color: '#1A0F0A',
        marginBottom: '0.5rem',
      }}
      {...props}
    />
  );
}

// ============================================
// BLOCKQUOTE ELEMENT
// ============================================

export function BlockquoteElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="blockquote"
      style={{
        borderLeft: '4px solid #C9A227',
        marginLeft: 0,
        marginRight: 0,
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
        paddingLeft: '1.5rem',
        paddingTop: '0.5rem',
        paddingBottom: '0.5rem',
        color: '#1A0F0A',
        fontStyle: 'italic',
        background: 'rgba(201, 162, 39, 0.1)',
        borderRadius: '0 8px 8px 0',
      }}
      {...props}
    />
  );
}

// ============================================
// CODE BLOCK ELEMENT
// ============================================

export function CodeBlockElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="pre"
      style={{
        backgroundColor: '#1A0F0A',
        border: '1px solid #C9A227',
        borderRadius: '8px',
        padding: '1rem',
        fontFamily: "'Fira Code', 'Monaco', monospace",
        fontSize: '0.875rem',
        color: '#1A0F0A',
        overflow: 'auto',
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
      }}
      {...props}
    />
  );
}

export function CodeLineElement(props: PlateElementProps) {
  return <PlateElement as="div" {...props} />;
}

// ============================================
// LIST ELEMENTS
// ============================================

export function BulletedListElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="ul"
      style={{
        listStyleType: 'disc',
        listStylePosition: 'outside',
        paddingLeft: '1.5rem',
        marginTop: '0.25rem',
        marginBottom: '0.25rem',
        marginLeft: '1rem',
        color: '#1A0F0A',
      }}
      {...props}
    />
  );
}

export function NumberedListElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="ol"
      style={{
        listStyleType: 'decimal',
        listStylePosition: 'outside',
        paddingLeft: '1.5rem',
        marginTop: '0.25rem',
        marginBottom: '0.25rem',
        marginLeft: '1rem',
        color: '#1A0F0A',
      }}
      {...props}
    />
  );
}

export function ListItemElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="li"
      style={{
        color: '#1A0F0A',
        marginBottom: '0.25rem',
        display: 'list-item',
      }}
      {...props}
    />
  );
}

// ============================================
// TODO / CHECKBOX ELEMENT
// ============================================

export function TodoElement(props: PlateElementProps) {
  const { element, children, ...rest } = props;
  const editor = useEditorRef();
  const todoElement = element as { checked?: boolean; id?: string };
  const checked = todoElement?.checked ?? false;
  
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const findPath = (nodes: any[], targetId: string, currentPath: number[] = []): number[] | null => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const path = [...currentPath, i];
          
          if (node.id === targetId) {
            return path;
          }
          
          if (node.children && Array.isArray(node.children) && node.children.some((c: any) => c.type)) {
            const found = findPath(node.children, targetId, path);
            if (found) return found;
          }
        }
        return null;
      };
      
      const path = todoElement.id ? findPath(editor.children as any[], todoElement.id) : null;
      
      if (path) {
        Transforms.setNodes(
          editor as any,
          { checked: !checked } as any,
          { at: path }
        );
      }
    } catch (err) {
      console.warn('Failed to toggle todo:', err);
    }
  };
  
  return (
    <PlateElement
      as="div"
      element={element}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        marginBottom: '0.25rem',
      }}
      {...rest}
    >
      <span
        contentEditable={false}
        onClick={handleToggle}
        onMouseDown={(e) => e.preventDefault()}
        style={{
          width: '18px',
          height: '18px',
          border: '2px solid #1A0F0A',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          marginTop: '3px',
          background: checked ? '#C9A227' : 'transparent',
          color: checked ? '#1A0F0A' : 'transparent',
          fontSize: '12px',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        {checked ? '✓' : ''}
      </span>
      <span
        style={{
          textDecoration: checked ? 'line-through' : 'none',
          opacity: checked ? 0.6 : 1,
          color: '#1A0F0A',
          flex: 1,
        }}
      >
        {children}
      </span>
    </PlateElement>
  );
}

// ============================================
// DIVIDER / HORIZONTAL RULE
// ============================================

export function DividerElement(props: PlateElementProps) {
  return (
    <PlateElement {...props}>
      <div contentEditable={false}>
        <hr
          style={{
            border: 'none',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #1A0F0A, transparent)',
            margin: '1.5rem 0',
          }}
        />
      </div>
      {props.children}
    </PlateElement>
  );
}

// ============================================
// CALLOUT / ALERT ELEMENT
// ============================================

const calloutStyles = {
  info: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3B82F6', icon: '💡' },
  warning: { bg: 'rgba(234, 179, 8, 0.15)', border: '#EAB308', icon: '⚠️' },
  success: { bg: 'rgba(34, 197, 94, 0.15)', border: '#22C55E', icon: '✅' },
  danger: { bg: 'rgba(239, 68, 68, 0.15)', border: '#EF4444', icon: '🔥' },
};

export function CalloutElement(props: PlateElementProps) {
  const element = props.element as { variant?: 'info' | 'warning' | 'success' | 'danger' };
  const variant = element?.variant || 'info';
  const style = calloutStyles[variant];
  
  return (
    <PlateElement
      as="div"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem',
        borderRadius: '8px',
        background: style.bg,
        borderLeft: `4px solid ${style.border}`,
        margin: '0.5rem 0',
      }}
      {...props}
    >
      <span contentEditable={false} style={{ fontSize: '1.25rem' }}>
        {style.icon}
      </span>
      <div style={{ flex: 1, color: '#1A0F0A' }}>{props.children}</div>
    </PlateElement>
  );
}

// ============================================
// LINK ELEMENT
// ============================================

export function LinkElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="a"
      style={{
        color: '#1A0F0A',
        textDecoration: 'underline',
        cursor: 'pointer',
      }}
      {...props}
    />
  );
}

// ============================================
// IMAGE ELEMENT
// ============================================

export function ImageElement(props: PlateElementProps) {
  const element = props.element as { url?: string; alt?: string };
  
  return (
    <PlateElement {...props}>
      <div contentEditable={false} style={{ margin: '1rem 0' }}>
        <img
          src={element?.url}
          alt={element?.alt || ''}
          style={{
            maxWidth: '100%',
            borderRadius: '8px',
            border: '2px solid #1A0F0A',
          }}
        />
      </div>
      {props.children}
    </PlateElement>
  );
}

// ============================================
// TABLE ELEMENTS
// ============================================

// Context for sharing column widths across table cells
const TableContext = React.createContext<{
  columnWidths: number[];
  setColumnWidth: (index: number, width: number) => void;
  numCols: number;
  isLastColumn: (index: number) => boolean;
} | null>(null);

// Helper functions for table operations
const findTablePath = (editor: any, element: any): number[] | null => {
  const findPath = (nodes: any[], targetId: string, currentPath: number[] = []): number[] | null => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const path = [...currentPath, i];
      
      if (node.id === targetId || node === element) {
        return path;
      }
      
      if (node.children && Array.isArray(node.children)) {
        const found = findPath(node.children, targetId, path);
        if (found) return found;
      }
    }
    return null;
  };
  
  return findPath(editor.children as any[], (element as any).id);
};

const getTableInfo = (editor: any, tablePath: number[]) => {
  const tableNode = Node.get(editor, tablePath) as any;
  const rows = tableNode.children || [];
  const numRows = rows.length;
  const numCols = rows[0]?.children?.length || 0;
  return { tableNode, rows, numRows, numCols };
};

export function TableElement(props: PlateElementProps) {
  const { element, children, ...rest } = props;
  const editor = useEditorRef();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const tableRef = React.useRef<HTMLDivElement>(null);
  
  // Get number of columns from element
  const tableElement = element as { children?: any[] };
  const numCols = tableElement.children?.[0]?.children?.length || 2;
  
  // Initialize column widths - distribute evenly
  const [columnWidths, setColumnWidths] = useState<number[]>(() => {
    return Array(numCols).fill(100 / numCols);
  });
  
  // Update column widths when number of columns changes
  React.useEffect(() => {
    const currentNumCols = tableElement.children?.[0]?.children?.length || 2;
    if (currentNumCols !== columnWidths.length) {
      // Redistribute widths evenly
      setColumnWidths(Array(currentNumCols).fill(100 / currentNumCols));
    }
  }, [tableElement.children?.[0]?.children?.length]);
  
  const setColumnWidth = useCallback((index: number, widthPercent: number) => {
    setColumnWidths(prev => {
      const newWidths = [...prev];
      const diff = widthPercent - prev[index];
      
      // Adjust the next column to compensate
      if (index < newWidths.length - 1) {
        const nextWidth = prev[index + 1] - diff;
        // Ensure minimum width of 10%
        if (nextWidth >= 10 && widthPercent >= 10) {
          newWidths[index] = widthPercent;
          newWidths[index + 1] = nextWidth;
        }
      }
      
      return newWidths;
    });
  }, []);
  
  const isLastColumn = useCallback((index: number) => {
    return index === columnWidths.length - 1;
  }, [columnWidths.length]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  }, []);

  const closeMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const addRow = useCallback(() => {
    try {
      const tablePath = findTablePath(editor, element);
      if (!tablePath) return;
      
      const { numCols, numRows } = getTableInfo(editor, tablePath);
      
      const newRow = {
        type: 'tr',
        children: Array(numCols).fill(null).map(() => ({
          type: 'td',
          children: [{ text: '' }],
        })),
      };
      
      Transforms.insertNodes(editor as any, newRow as any, {
        at: [...tablePath, numRows],
      });
    } catch (err) {
      console.warn('Failed to add row:', err);
    }
    closeMenu();
  }, [editor, element, closeMenu]);

  const addColumn = useCallback(() => {
    try {
      const tablePath = findTablePath(editor, element);
      if (!tablePath) return;
      
      const { rows, numCols } = getTableInfo(editor, tablePath);
      
      // Add a cell to each row
      for (let i = rows.length - 1; i >= 0; i--) {
        const isHeader = i === 0;
        const newCell = {
          type: isHeader ? 'th' : 'td',
          children: [{ text: isHeader ? 'Header' : '' }],
        };
        
        Transforms.insertNodes(editor as any, newCell as any, {
          at: [...tablePath, i, numCols],
        });
      }
      
      // Redistribute column widths evenly
      const newNumCols = numCols + 1;
      setColumnWidths(Array(newNumCols).fill(100 / newNumCols));
    } catch (err) {
      console.warn('Failed to add column:', err);
    }
    closeMenu();
  }, [editor, element, closeMenu]);

  const deleteRow = useCallback(() => {
    try {
      const tablePath = findTablePath(editor, element);
      if (!tablePath) return;
      
      const { numRows } = getTableInfo(editor, tablePath);
      
      if (numRows > 1) {
        // Delete last row
        Transforms.removeNodes(editor as any, {
          at: [...tablePath, numRows - 1],
        });
      }
    } catch (err) {
      console.warn('Failed to delete row:', err);
    }
    closeMenu();
  }, [editor, element, closeMenu]);

  const deleteColumn = useCallback(() => {
    try {
      const tablePath = findTablePath(editor, element);
      if (!tablePath) return;
      
      const { rows, numCols } = getTableInfo(editor, tablePath);
      
      if (numCols > 1) {
        // Delete last column from each row
        for (let i = rows.length - 1; i >= 0; i--) {
          Transforms.removeNodes(editor as any, {
            at: [...tablePath, i, numCols - 1],
          });
        }
        
        // Redistribute column widths evenly
        const newNumCols = numCols - 1;
        setColumnWidths(Array(newNumCols).fill(100 / newNumCols));
      }
    } catch (err) {
      console.warn('Failed to delete column:', err);
    }
    closeMenu();
  }, [editor, element, closeMenu]);

  const exitTable = useCallback(() => {
    try {
      const tablePath = findTablePath(editor, element);
      if (!tablePath) return;
      
      // Insert a new paragraph after the table
      const newParagraph = {
        type: 'p',
        children: [{ text: '' }],
      };
      
      Transforms.insertNodes(editor as any, newParagraph as any, {
        at: [tablePath[0] + 1],
      });
      
      // Move cursor to the new paragraph
      Transforms.select(editor as any, [tablePath[0] + 1, 0]);
    } catch (err) {
      console.warn('Failed to exit table:', err);
    }
    closeMenu();
  }, [editor, element, closeMenu]);

  const deleteTable = useCallback(() => {
    try {
      const tablePath = findTablePath(editor, element);
      if (!tablePath) return;
      
      Transforms.removeNodes(editor as any, { at: tablePath });
    } catch (err) {
      console.warn('Failed to delete table:', err);
    }
    closeMenu();
  }, [editor, element, closeMenu]);

  // Close menu on click outside
  React.useEffect(() => {
    if (showMenu) {
      const handleClick = () => closeMenu();
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showMenu, closeMenu]);

  return (
    <TableContext.Provider value={{ columnWidths, setColumnWidth, numCols: columnWidths.length, isLastColumn }}>
      <PlateElement
        element={element}
        {...rest}
      >
        <div ref={tableRef} style={{ position: 'relative', margin: '1rem 0' }}>
          {/* Table toolbar */}
          <div
            contentEditable={false}
            style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '8px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={addRow}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                background: 'rgba(201, 162, 39, 0.2)',
                border: '1px solid #C9A227',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#1A0F0A',
                fontFamily: "'Cinzel', serif",
              }}
            >
              + Row
            </button>
            <button
              onClick={addColumn}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                background: 'rgba(201, 162, 39, 0.2)',
                border: '1px solid #C9A227',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#1A0F0A',
                fontFamily: "'Cinzel', serif",
              }}
            >
              + Column
            </button>
            <button
              onClick={deleteRow}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#1A0F0A',
                fontFamily: "'Cinzel', serif",
              }}
            >
              - Row
            </button>
            <button
              onClick={deleteColumn}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#1A0F0A',
                fontFamily: "'Cinzel', serif",
              }}
            >
              - Column
            </button>
            <button
              onClick={exitTable}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid #3B82F6',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#1A0F0A',
                fontFamily: "'Cinzel', serif",
              }}
            >
              Exit Table ↓
            </button>
            <button
              onClick={deleteTable}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                background: 'rgba(239, 68, 68, 0.3)',
                border: '1px solid #EF4444',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#1A0F0A',
                fontFamily: "'Cinzel', serif",
              }}
            >
              Delete Table
            </button>
          </div>
          
          <div
            style={{
              border: '1px solid #4A3728',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <table
              onContextMenu={handleContextMenu}
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
              }}
            >
              <tbody>
                {children}
              </tbody>
            </table>
          </div>

          {/* Context menu */}
          {showMenu && (
            <div
              contentEditable={false}
              style={{
                position: 'fixed',
                top: menuPosition.y,
                left: menuPosition.x,
                background: '#4A3728',
                border: '2px solid #C9A227',
                borderRadius: '8px',
                padding: '8px 0',
                zIndex: 1000,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                onClick={addRow}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  color: '#F5E6D3',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201, 162, 39, 0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                ➕ Add Row
              </div>
              <div
                onClick={addColumn}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  color: '#F5E6D3',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201, 162, 39, 0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                ➕ Add Column
              </div>
              <div style={{ height: '1px', background: 'rgba(201, 162, 39, 0.3)', margin: '4px 0' }} />
              <div
                onClick={deleteRow}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  color: '#F5E6D3',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                ➖ Delete Row
              </div>
              <div
                onClick={deleteColumn}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  color: '#F5E6D3',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                ➖ Delete Column
              </div>
              <div style={{ height: '1px', background: 'rgba(201, 162, 39, 0.3)', margin: '4px 0' }} />
              <div
                onClick={exitTable}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  color: '#F5E6D3',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                ↓ Exit Table
              </div>
              <div
                onClick={deleteTable}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  color: '#EF4444',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                🗑️ Delete Table
              </div>
            </div>
          )}
        </div>
      </PlateElement>
    </TableContext.Provider>
  );
}

// Track column index for cells
const RowContext = React.createContext<{ rowIndex: number }>({ rowIndex: 0 });

export function TableRowElement(props: PlateElementProps) {
  const { element } = props;
  // Get row index from parent - we'll track it via the element's position
  return (
    <PlateElement
      as="tr"
      style={{
        borderBottom: '1px solid rgba(201, 162, 39, 0.8)',
      }}
      {...props}
    />
  );
}

// Shared cell component logic
function useTableCell(cellIndex: number) {
  const tableContext = React.useContext(TableContext);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(0);
  const tableWidthRef = React.useRef(0);
  
  const widthPercent = tableContext?.columnWidths[cellIndex] ?? (100 / (tableContext?.numCols || 2));
  const isLast = tableContext?.isLastColumn(cellIndex) ?? false;
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isLast) return; // Don't allow resizing the last column
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = widthPercent;
    
    // Get table width
    const table = (e.target as HTMLElement).closest('table');
    tableWidthRef.current = table?.offsetWidth || 800;
  }, [widthPercent, isLast]);

  React.useEffect(() => {
    if (!isResizing || !tableContext) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diffPx = e.clientX - startXRef.current;
      const diffPercent = (diffPx / tableWidthRef.current) * 100;
      const newWidthPercent = startWidthRef.current + diffPercent;
      
      tableContext.setColumnWidth(cellIndex, newWidthPercent);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, cellIndex, tableContext]);

  return { widthPercent, isResizing, isLast, handleMouseDown };
}

// We need to track the cell index - we'll use a simple approach
let currentCellIndex = 0;

export function TableCellElement(props: PlateElementProps) {
  const { element, children, ...rest } = props;
  const tableContext = React.useContext(TableContext);
  
  // Get cell index from the parent row
  const [cellIndex, setCellIndex] = useState(0);
  const cellRef = React.useRef<HTMLTableCellElement>(null);
  
  React.useEffect(() => {
    if (cellRef.current) {
      const row = cellRef.current.parentElement;
      if (row) {
        const cells = Array.from(row.children);
        const index = cells.indexOf(cellRef.current);
        setCellIndex(index);
      }
    }
  });
  
  const { widthPercent, isResizing, isLast, handleMouseDown } = useTableCell(cellIndex);

  return (
    <PlateElement
      as="td"
      element={element}
      ref={cellRef as any}
      style={{
        padding: '0.75rem',
        color: '#1A0F0A',
        borderRight: isLast ? 'none' : '1px solid rgba(201, 162, 39, 0.8)',
        width: `${widthPercent}%`,
        position: 'relative',
        overflow: 'hidden',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap',
      }}
      {...rest}
    >
      {children}
      {/* Resize handle - only show on internal borders */}
      {!isLast && (
        <div
          contentEditable={false}
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            right: -3,
            top: 0,
            bottom: 0,
            width: '6px',
            cursor: 'col-resize',
            background: isResizing ? 'rgba(201, 162, 39, 0.5)' : 'transparent',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            if (!isResizing) e.currentTarget.style.background = 'rgba(201, 162, 39, 0.3)';
          }}
          onMouseLeave={(e) => {
            if (!isResizing) e.currentTarget.style.background = 'transparent';
          }}
        />
      )}
    </PlateElement>
  );
}

export function TableHeaderCellElement(props: PlateElementProps) {
  const { element, children, ...rest } = props;
  const tableContext = React.useContext(TableContext);
  
  // Get cell index from the parent row
  const [cellIndex, setCellIndex] = useState(0);
  const cellRef = React.useRef<HTMLTableCellElement>(null);
  
  React.useEffect(() => {
    if (cellRef.current) {
      const row = cellRef.current.parentElement;
      if (row) {
        const cells = Array.from(row.children);
        const index = cells.indexOf(cellRef.current);
        setCellIndex(index);
      }
    }
  });
  
  const { widthPercent, isResizing, isLast, handleMouseDown } = useTableCell(cellIndex);

  return (
    <PlateElement
      as="th"
      element={element}
      ref={cellRef as any}
      style={{
        padding: '0.75rem',
        background: 'rgba(201, 162, 39, 0.2)',
        color: '#1A0F0A',
        fontFamily: "'Cinzel', serif",
        fontWeight: 600,
        textAlign: 'left',
        borderRight: isLast ? 'none' : '1px solid rgba(201, 162, 39, 0.8)',
        width: `${widthPercent}%`,
        position: 'relative',
        overflow: 'hidden',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap',
      }}
      {...rest}
    >
      {children}
      {/* Resize handle - only show on internal borders */}
      {!isLast && (
        <div
          contentEditable={false}
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            right: -3,
            top: 0,
            bottom: 0,
            width: '6px',
            cursor: 'col-resize',
            background: isResizing ? 'rgba(201, 162, 39, 0.5)' : 'transparent',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            if (!isResizing) e.currentTarget.style.background = 'rgba(201, 162, 39, 0.3)';
          }}
          onMouseLeave={(e) => {
            if (!isResizing) e.currentTarget.style.background = 'transparent';
          }}
        />
      )}
    </PlateElement>
  );
}

