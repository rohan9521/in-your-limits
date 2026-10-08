import { useCallback, useState } from 'react'
import { AnalyticsPanel } from './components/AnalyticsPanel'
import { RequestComposer } from './components/RequestComposer'
import { SettingsModal } from './components/SettingsModal'
import { Sidebar } from './components/Sidebar'
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
    chat.showNotice('Connections saved. Your selected provider will be tried first, with failover to other connected providers.')
  }

  return (
    <div className="app-shell chat-app-shell">
      <Sidebar activeView={activeView} onViewChange={setActiveView} onOpenSettings={openSettings} />
      <main className="main-content chat-main">
        <Topbar activeView={activeView} onOpenSettings={openSettings} />
        <ViewTabs activeView={activeView} onViewChange={setActiveView} />
        {activeView === 'overview' ? <section className="chat-page">
          <div className="chat-meta">
            <span className={`chat-local-status ${localModel.status}`}><i />Local compression {localModel.status === 'connected' ? 'on' : 'offline'}</span>
            <span>{connections.connectedProviders.length} provider{connections.connectedProviders.length === 1 ? '' : 's'} connected</span>
            {localModel.status !== 'connected' && <button type="button" onClick={localModel.retry}>Retry Ollama</button>}
          </div>
          {chat.notice && <div className="notice" role="status">{chat.notice}</div>}
          <RequestComposer prompt={prompt} provider={selectedProvider} busy={chat.busy} records={chat.records} localModel={connections.localModel} onPromptChange={setPrompt} onProviderChange={setSelectedProvider} onSubmit={() => chat.submit({ prompt, provider: selectedProvider })} />
        </section> : <AnalyticsPanel records={chat.records} onClear={chat.clearHistory} />}
      </main>
      {settingsOpen && settingsDraft && <SettingsModal settings={settingsDraft} onChangeSetting={updateDraftSetting} onChangeKey={updateDraftKey} onSave={saveConnections} onClose={closeSettings} />}
    </div>
  )
}
