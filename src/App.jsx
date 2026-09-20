import { useCallback, useState } from 'react'
import { PROVIDERS } from './config/providers'
import { ConnectionBanner } from './components/ConnectionBanner'
import { AnalyticsPanel } from './components/AnalyticsPanel'
import { NextSteps } from './components/NextSteps'
import { RequestComposer } from './components/RequestComposer'
import { SettingsModal } from './components/SettingsModal'
import { Sidebar } from './components/Sidebar'
import { StatsGrid } from './components/StatsGrid'
import { Topbar } from './components/Topbar'
import { ViewTabs } from './components/ViewTabs'
import { useChatRequest } from './hooks/useChatRequest'
import { useConnectionSettings } from './hooks/useConnectionSettings'
import { useLocalModelStatus } from './hooks/useLocalModelStatus'

export function App() {
  const [activeView, setActiveView] = useState('overview')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('auto')
  const connections = useConnectionSettings()
  const localModel = useLocalModelStatus(connections.localUrl)
  const chat = useChatRequest({
    keys: connections.keys,
    localUrl: connections.localUrl,
    localModel: connections.localModel,
    connectedProviders: connections.connectedProviders,
    localStatus: localModel.status,
  })

  function openSettings() {
    setSettingsDraft({ ...connections, keys: { ...connections.keys } })
    setSettingsOpen(true)
  }

  const closeSettings = useCallback(() => {
    setSettingsOpen(false)
    setSettingsDraft(null)
  }, [])

  function updateDraftSetting(name, value) {
    setSettingsDraft((current) => ({ ...current, [name]: value }))
  }

  function updateDraftKey(providerId, value) {
    setSettingsDraft((current) => ({ ...current, keys: { ...current.keys, [providerId]: value } }))
  }

  function saveConnections() {
    connections.saveSettings(settingsDraft)
    setSettingsOpen(false)
    setSettingsDraft(null)
    chat.showNotice('Connections saved. Automatic routing will use the first available provider.')
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onViewChange={setActiveView} onOpenSettings={openSettings} />
      <main className="main-content">
        <Topbar activeView={activeView} onOpenSettings={openSettings} />
        <ViewTabs activeView={activeView} onViewChange={setActiveView} />
        {activeView === 'overview' ? <>
          <ConnectionBanner localModel={connections.localModel} localUrl={connections.localUrl} status={localModel.status} onRetry={localModel.retry} />
          {chat.notice && <div className="notice" role="status">{chat.notice}</div>}
          <StatsGrid connectedCount={connections.connectedProviders.length} providerCount={PROVIDERS.length} localStatus={localModel.status} localModel={connections.localModel} />
          <RequestComposer prompt={prompt} provider={selectedProvider} busy={chat.busy} records={chat.records} onPromptChange={setPrompt} onProviderChange={setSelectedProvider} onSubmit={() => chat.submit({ prompt, provider: selectedProvider })} />
          <NextSteps onOpenSettings={openSettings} />
        </> : <AnalyticsPanel records={chat.records} onClear={chat.clearHistory} />}
      </main>
      {settingsOpen && settingsDraft && <SettingsModal settings={settingsDraft} onChangeSetting={updateDraftSetting} onChangeKey={updateDraftKey} onSave={saveConnections} onClose={closeSettings} />}
    </div>
  )
}
