import {type SanityConfig} from '@sanity/sdk'
import {SanityApp} from '@sanity/sdk-react'
import {FolderStructure} from './components/FolderStructure'
import './App.css'

function App() {
  // apps can access many different projects or other sources of data
  const sanityConfigs: SanityConfig[] = [
    {
      projectId: 'ue0al2wl',
      dataset: 'production',
    },
  ]

  return (
    <div className="app-container">
      <SanityApp config={sanityConfigs} fallback={<div>Loading...</div>}>
        <FolderStructure />
      </SanityApp>
    </div>
  )
}

export default App
