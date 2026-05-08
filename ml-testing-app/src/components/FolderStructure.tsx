import { useState, useTransition, Suspense, useRef } from 'react'
import {
  useDocuments,
  useDocument,
  useDocumentProjection,
  useEditDocument,
  useApplyDocumentActions,
  type DocumentHandle,
} from '@sanity/sdk-react'
import { createClient } from '@sanity/client'
import {
  FolderIcon,
  DocumentIcon,
  AddCircleIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EditIcon,
  ArrowRightIcon,
  DatabaseIcon,
  InfoFilledIcon,
  AddIcon,
  PublishIcon
} from '@sanity/icons'
import './FolderStructure.css'

// Standard client for mutations, using the exact config from index.js
const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET,
  useCdn: false,
  token: import.meta.env.VITE_SANITY_API_TOKEN,
  apiVersion: import.meta.env.VITE_SANITY_API_VERSION,
})

export function FolderStructure() {
  const { data: treeHandles } = useDocuments({ documentType: 'sanity.tree' })
  const { data: directoryHandles } = useDocuments({ documentType: 'sanity.directory' })
  const { data: pageHandles } = useDocuments({ documentType: 'page' })

  const [selectedTreeId, setSelectedTreeId] = useState<string | null>('root-tree')
  const [selectedItem, setSelectedItem] = useState<{ handle: DocumentHandle; data: any } | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({ 'root-tree': true })

  const [newTreeTitle, setNewTreeTitle] = useState('')
  const [isCreatingTree, setIsCreatingTree] = useState(false)

  const toggleExpand = (id: string) => {
    setExpandedKeys(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Create a new Root Tree node
  const handleCreateTree = async () => {
    if (!newTreeTitle.trim()) return
    try {
      const title = newTreeTitle.trim()
      setNewTreeTitle('')
      setIsCreatingTree(false)
      const res = await client.create({
        _type: 'sanity.tree',
        title,
      })
      setSelectedTreeId(res._id)
    } catch (err) {
      console.error('Failed to create tree:', err)
      alert('Error creating root tree. See console.')
    }
  }

  // Helper to create a new Folder (directory)
  const handleCreateDirectory = async (parentRef: string, defaultName = 'New Folder') => {
    try {
      const name = prompt('Enter folder name:', defaultName)
      if (!name) return
      await client.create({
        _type: 'sanity.directory',
        name,
        parent: { _type: 'reference', _ref: parentRef },
      })
    } catch (err) {
      console.error('Failed to create folder:', err)
    }
  }

  // Helper to create a new Page
  const handleCreatePage = async (parentRef: string, defaultTitle = 'New Page') => {
    try {
      const title = prompt('Enter page title:', defaultTitle)
      if (!title) return
      await client.create({
        _type: 'page',
        title,
        parent: { _type: 'reference', _ref: parentRef },
      })
    } catch (err) {
      console.error('Failed to create page:', err)
    }
  }

  return (
    <div className="folder-explorer">
      {/* Sidebar - Root Trees */}
      <div className="explorer-sidebar">
        <div className="sidebar-header">
          <DatabaseIcon className="sidebar-icon" />
          <span>Navigation Trees</span>
        </div>

        <div className="tree-list">
          {treeHandles.map(handle => (
            <Suspense key={handle.documentId} fallback={<div className="loading-item">Loading tree...</div>}>
              <TreeSelectorItem
                handle={handle}
                isSelected={selectedTreeId === handle.documentId}
                onSelect={(id) => {
                  setSelectedTreeId(id)
                  setSelectedItem(null)
                }}
              />
            </Suspense>
          ))}
        </div>

        <div className="add-tree-section">
          {isCreatingTree ? (
            <div className="create-tree-form">
              <input
                type="text"
                placeholder="Tree Title (e.g. Footer)"
                value={newTreeTitle}
                onChange={e => setNewTreeTitle(e.target.value)}
                autoFocus
              />
              <div className="form-actions">
                <button className="btn-save" onClick={handleCreateTree}>Create</button>
                <button className="btn-cancel" onClick={() => setIsCreatingTree(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn-add-tree" onClick={() => setIsCreatingTree(true)}>
              <AddCircleIcon /> Add Root Tree
            </button>
          )}
        </div>
      </div>

      {/* Main Explorer Area */}
      <div className="explorer-main">
        {selectedTreeId ? (
          <Suspense fallback={<div className="loading-main">Loading explorer...</div>}>
            <ActiveTreeExplorer
              treeId={selectedTreeId}
              directoryHandles={directoryHandles}
              pageHandles={pageHandles}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              expandedKeys={expandedKeys}
              toggleExpand={toggleExpand}
              onCreateFolder={handleCreateDirectory}
              onCreatePage={handleCreatePage}
            />
          </Suspense>
        ) : (
          <div className="no-selection-state">
            <FolderIcon className="large-icon" />
            <h2>No Navigation Tree Selected</h2>
            <p>Select or create a navigation tree from the sidebar to begin building your folder structure.</p>
          </div>
        )}
      </div>

      {/* Inspector Panel */}
      <div className="explorer-inspector">
        <div className="inspector-header">
          <InfoFilledIcon />
          <span>Properties Inspector</span>
        </div>
        {selectedItem ? (
          <InspectorPanel
            item={selectedItem}
            setSelectedItem={setSelectedItem}
            directoryHandles={directoryHandles}
          />
        ) : (
          <div className="empty-inspector">
            <InfoFilledIcon className="large-icon-muted" />
            <p>Select any item in the folder structure to view and edit its metadata, move it, or draft changes inside a Release.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Tree Selector Item
function TreeSelectorItem({ handle, isSelected, onSelect }: { handle: DocumentHandle; isSelected: boolean; onSelect: (id: string) => void }) {
  const { data } = useDocumentProjection({
    ...handle,
    projection: '{ title }',
  })

  if (!data) return null

  return (
    <button
      className={`tree-item-btn ${isSelected ? 'active' : ''}`}
      onClick={() => onSelect(handle.documentId)}
    >
      <DatabaseIcon />
      <span className="tree-title">{data.title || 'Untitled Tree'}</span>
    </button>
  )
}

// Active Tree Explorer Component
function ActiveTreeExplorer({
  treeId,
  directoryHandles,
  pageHandles,
  selectedItem,
  setSelectedItem,
  expandedKeys,
  toggleExpand,
  onCreateFolder,
  onCreatePage,
}: {
  treeId: string
  directoryHandles: DocumentHandle[]
  pageHandles: DocumentHandle[]
  selectedItem: any
  setSelectedItem: any
  expandedKeys: Record<string, boolean>
  toggleExpand: (id: string) => void
  onCreateFolder: (parentRef: string) => void
  onCreatePage: (parentRef: string) => void
}) {
  const treeHandle = { documentId: treeId, documentType: 'sanity.tree' } as const
  const { data: treeData } = useDocumentProjection({
    ...treeHandle,
    projection: '{ title }',
  })

  const isExpanded = expandedKeys[treeId] ?? true

  if (!treeData) return <div className="loading-main">Fetching tree root...</div>

  return (
    <div className="active-tree-card">
      <div className="tree-root-header">
        <div className="title-section" onClick={() => toggleExpand(treeId)}>
          <span className="arrow-toggle">
            {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </span>
          <DatabaseIcon className="root-icon" />
          <span className="root-title">{treeData.title}</span>
          <span className="root-badge">Root Tree</span>
        </div>
        <div className="action-buttons">
          <button className="action-btn" title="Add Folder" onClick={() => onCreateFolder(treeId)}>
            <FolderIcon /> +Folder
          </button>
          <button className="action-btn" title="Add Page" onClick={() => onCreatePage(treeId)}>
            <DocumentIcon /> +Page
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="tree-children">
          {/* Sub-directories directly under this tree */}
          {directoryHandles.map(handle => (
            <Suspense key={handle.documentId} fallback={<div className="loading-node">...</div>}>
              <DirectoryNode
                handle={handle}
                parentId={treeId}
                activeId={selectedItem?.handle.documentId ?? null}
                onSelect={(h, d) => setSelectedItem({ handle: h, data: d })}
                expandedKeys={expandedKeys}
                toggleExpand={toggleExpand}
                directoryHandles={directoryHandles}
                pageHandles={pageHandles}
                onCreateFolder={onCreateFolder}
                onCreatePage={onCreatePage}
              />
            </Suspense>
          ))}

          {/* Pages directly under this tree (if any) */}
          {pageHandles.map(handle => (
            <Suspense key={handle.documentId} fallback={<div className="loading-node">...</div>}>
              <PageNode
                handle={handle}
                parentId={treeId}
                activeId={selectedItem?.handle.documentId ?? null}
                onSelect={(h, d) => setSelectedItem({ handle: h, data: d })}
              />
            </Suspense>
          ))}
        </div>
      )}
    </div>
  )
}

// Directory Node Component
function DirectoryNode({
  handle,
  parentId,
  activeId,
  onSelect,
  expandedKeys,
  toggleExpand,
  directoryHandles,
  pageHandles,
  onCreateFolder,
  onCreatePage,
}: {
  handle: DocumentHandle
  parentId: string
  activeId: string | null
  onSelect: (handle: DocumentHandle, data: any) => void
  expandedKeys: Record<string, boolean>
  toggleExpand: (id: string) => void
  directoryHandles: DocumentHandle[]
  pageHandles: DocumentHandle[]
  onCreateFolder: (parentRef: string) => void
  onCreatePage: (parentRef: string) => void
}) {
  const { data } = useDocumentProjection({
    ...handle,
    projection: '{ name, "parentRef": parent._ref }',
  })

  const isExpanded = expandedKeys[handle.documentId] ?? false
  const isSelected = activeId === handle.documentId

  if (!data || data.parentRef !== parentId) return null

  return (
    <div className={`tree-node directory-node ${isSelected ? 'selected' : ''}`}>
      <div className="node-row" onClick={() => onSelect(handle, data)}>
        <span className="arrow-toggle" onClick={(e) => { e.stopPropagation(); toggleExpand(handle.documentId); }}>
          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
        <FolderIcon className="folder-icon" />
        <span className="node-title">{data.name || 'Untitled Folder'}</span>

        <div className="node-hover-actions">
          <button className="row-action-btn" title="Add Subfolder" onClick={(e) => { e.stopPropagation(); onCreateFolder(handle.documentId); }}>
            <FolderIcon />+
          </button>
          <button className="row-action-btn" title="Add Page" onClick={(e) => { e.stopPropagation(); onCreatePage(handle.documentId); }}>
            <DocumentIcon />+
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="node-children">
          {/* Recursive Directories */}
          {directoryHandles.map(h => (
            <Suspense key={h.documentId} fallback={null}>
              <DirectoryNode
                handle={h}
                parentId={handle.documentId}
                activeId={activeId}
                onSelect={onSelect}
                expandedKeys={expandedKeys}
                toggleExpand={toggleExpand}
                directoryHandles={directoryHandles}
                pageHandles={pageHandles}
                onCreateFolder={onCreateFolder}
                onCreatePage={onCreatePage}
              />
            </Suspense>
          ))}

          {/* Child Pages */}
          {pageHandles.map(h => (
            <Suspense key={h.documentId} fallback={null}>
              <PageNode
                handle={h}
                parentId={handle.documentId}
                activeId={activeId}
                onSelect={onSelect}
              />
            </Suspense>
          ))}
        </div>
      )}
    </div>
  )
}

// Page Node Component
function PageNode({
  handle,
  parentId,
  activeId,
  onSelect,
}: {
  handle: DocumentHandle
  parentId: string
  activeId: string | null
  onSelect: (handle: DocumentHandle, data: any) => void
}) {
  const { data } = useDocumentProjection({
    ...handle,
    projection: '{ title, "parentRef": parent._ref }',
  })

  const isSelected = activeId === handle.documentId

  if (!data || data.parentRef !== parentId) return null

  return (
    <div
      className={`tree-node page-node ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(handle, data)}
    >
      <div className="node-row">
        <span className="indent-spacer"></span>
        <DocumentIcon className="page-icon" />
        <span className="node-title">{data.title || 'Untitled Page'}</span>
      </div>
    </div>
  )
}

// Inspector Panel Component
function InspectorPanel({
  item,
  setSelectedItem,
  directoryHandles,
}: {
  item: { handle: DocumentHandle; data: any }
  setSelectedItem: any
  directoryHandles: DocumentHandle[]
}) {
  const { handle, data } = item
  const isDir = handle.documentType === 'sanity.directory'

  // Real-time fields using hooks
  const { data: title } = useDocument({ ...handle, path: isDir ? 'name' : 'title' })
  const editTitle = useEditDocument({ ...handle, path: isDir ? 'name' : 'title' })
  const applyActions = useApplyDocumentActions()

  const [moveToParentId, setMoveToParentId] = useState('')
  const [releaseName, setReleaseName] = useState('')
  const [isDrafting, setIsDrafting] = useState(false)

  // Move function (patches the parent reference)
  const handleMove = async () => {
    if (!moveToParentId) return
    try {
      await client
        .patch(handle.documentId)
        .set({ parent: { _type: 'reference', _ref: moveToParentId } })
        .commit()
      alert('Moved successfully!')
      setMoveToParentId('')
    } catch (err) {
      console.error('Failed to move item:', err)
      alert('Error moving item. See console.')
    }
  }

  // Delete function (with recursive safety like index.js)
  const handleDelete = async () => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this ${isDir ? 'folder' : 'page'}?`)
    if (!confirmDelete) return

    try {
      if (isDir) {
        // Safe recursive deletion of children
        const children = await client.fetch(`*[parent._ref == $id]._id`, { id: handle.documentId })
        if (children.length > 0) {
          const cascade = window.confirm(`This folder contains ${children.length} items. Delete them recursively?`)
          if (!cascade) return

          const transaction = client.transaction()
          children.forEach(cid => transaction.delete(cid))
          transaction.delete(handle.documentId)
          await transaction.commit()
        } else {
          await client.delete(handle.documentId)
        }
      } else {
        await client.delete(handle.documentId)
      }
      setSelectedItem(null)
      alert('Deleted successfully!')
    } catch (err) {
      console.error('Deletion failed:', err)
      alert(`Delete failed: ${err.message || err}`)
    }
  }

  // Release drafting helper (Step 6 of index.js)
  const handleDraftInRelease = async () => {
    if (!releaseName.trim()) return
    setIsDrafting(true)
    try {
      // 1. Create Release document
      const release = await client.create({
        _type: 'sanity.release',
        title: releaseName.trim()
      })

      // 2. Draft copy inside release context
      const releaseDocId = `versions.${release._id}.${handle.documentId}`
      await client.create({
        _type: handle.documentType,
        _id: releaseDocId,
        ...(isDir ? { name: `${title} (Release Copy)` } : { title: `${title} (Release Copy)` }),
        parent: data.parentRef ? { _type: 'reference', _ref: data.parentRef } : undefined
      })

      alert(`Created Release "${release.title}" and created draft duplicate with ID: ${releaseDocId}!`)
      setReleaseName('')
    } catch (err) {
      console.error('Failed to draft in release:', err)
      alert('Error creating release draft. See console.')
    } finally {
      setIsDrafting(false)
    }
  }

  return (
    <div className="inspector-content">
      <div className="inspector-card">
        <div className="inspector-item-title">
          {isDir ? <FolderIcon className="folder-icon" /> : <DocumentIcon className="page-icon" />}
          <h3>{isDir ? 'Folder Settings' : 'Page Settings'}</h3>
        </div>

        {/* Rename Input */}
        <div className="input-group">
          <label>Display Name</label>
          <input
            type="text"
            value={title ?? ''}
            onChange={e => editTitle(e.target.value)}
            placeholder={isDir ? 'Folder Name' : 'Page Title'}
          />
          <small className="help-text">Syncs with Content Lake in real-time</small>
        </div>

        {/* Technical metadata */}
        <div className="metadata-details">
          <div className="meta-row">
            <span className="meta-label">ID:</span>
            <span className="meta-value code">{handle.documentId}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Type:</span>
            <span className="meta-value code">{handle.documentType}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Parent ID:</span>
            <span className="meta-value code">{data.parentRef || 'None'}</span>
          </div>
        </div>

        {/* Move Item Section */}
        <div className="inspector-section">
          <h4>Move to Different Folder</h4>
          <div className="move-controls">
            <select
              value={moveToParentId}
              onChange={e => setMoveToParentId(e.target.value)}
            >
              <option value="">Select Target Folder...</option>
              {directoryHandles
                .filter(h => h.documentId !== handle.documentId) // cannot move to itself
                .map(h => (
                  <Suspense key={h.documentId} fallback={<option>Loading...</option>}>
                    <SelectOptionItem handle={h} />
                  </Suspense>
                ))}
            </select>
            <button className="btn-move" onClick={handleMove} disabled={!moveToParentId}>
              <ArrowRightIcon /> Move
            </button>
          </div>
        </div>

        {/* Release Drafting Section */}
        <div className="inspector-section">
          <h4>Draft inside a Release</h4>
          <p className="section-desc">Create a staging version of this document locked to a specific marketing campaign or release context.</p>
          <div className="release-controls">
            <input
              type="text"
              placeholder="e.g. Spring Reorg 2026"
              value={releaseName}
              onChange={e => setReleaseName(e.target.value)}
              disabled={isDrafting}
            />
            <button
              className="btn-release"
              onClick={handleDraftInRelease}
              disabled={!releaseName.trim() || isDrafting}
            >
              <PublishIcon /> {isDrafting ? 'Drafting...' : 'Create Draft'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="danger-zone">
          <h4>Danger Zone</h4>
          <button className="btn-danger" onClick={handleDelete}>
            <TrashIcon /> Delete {isDir ? 'Folder' : 'Page'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Select option item for rendering directory names inside dropdown
function SelectOptionItem({ handle }: { handle: DocumentHandle }) {
  const { data } = useDocumentProjection({
    ...handle,
    projection: '{ name }',
  })

  if (!data) return null

  return (
    <option value={handle.documentId}>
      {data.name || 'Untitled Folder'} ({handle.documentId.substring(0, 6)}...)
    </option>
  )
}
