import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:8000';
function truncate(str, max = 60) {
  const s = typeof str === 'string' ? str : JSON.stringify(str ?? '')
  return s.length <= max ? s : s.slice(0, max) + '…'
}

function App() {
  const [analyses, setAnalyses] = useState(null)
  const [loadingAnalyses, setLoadingAnalyses] = useState(false)
  const [health, setHealth] = useState(null)
  const [selectedRowId, setSelectedRowId] = useState(null)

  useEffect(() => {
    axios.get(`${API_BASE}/health`).then((r) => setHealth(r.data)).catch(() => setHealth({ status: 'error' }))
    loadAnalyses()
  }, [])

  const loadAnalyses = async () => {
    setLoadingAnalyses(true)
    try {
      const r = await axios.get(`${API_BASE}/analyses`)
      const rows = Array.isArray(r.data) ? r.data : []
      setAnalyses(
        rows.map((row) => ({
          id: row.id,
          old_schema: row.old_schema ?? '',
          new_schema: row.new_schema ?? '',
          is_breaking: Boolean(row.is_breaking),
          ai_summary: row.ai_summary ?? row.raw_response ?? '',
          created_at: row.created_at,
        }))
      )
    } catch (e) {
      console.error(e)
      setAnalyses([])
      alert('Failed to load analyses from Supabase.')
    }
    setLoadingAnalyses(false)
  }

  /** Parse ai_summary from DB: may be plain string or JSON string. */
  function getSummaryDisplay(raw) {
    const str = raw ?? ''
    if (typeof str !== 'string') return String(str)
    const trimmed = str.trim()
    if (!trimmed) return '—'
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.summary === 'string') return parsed.summary
          if (typeof parsed.message === 'string') return parsed.message
          return JSON.stringify(parsed, null, 2)
        }
      } catch {
        // fall through
      }
    }
    return str
  }

  const selectRow = (id) => {
    setSelectedRowId((prev) => (prev === id ? null : id))
  }

  const isBackendConnected = health?.status === 'ok'
  const hasNoAnalyses = Array.isArray(analyses) && analyses.length === 0
  const list = analyses ?? []
  const selectedRow = selectedRowId != null ? list.find((a) => a.id === selectedRowId || String(a.id) === String(selectedRowId)) : null

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '1.5rem 2rem' }}>
      <h1 style={{ margin: '0 0 1rem', fontSize: '1.5rem', fontWeight: 600, color: '#1a202c' }}>
        Metadata AI Analyzer
      </h1>

      {health && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '10px 14px',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: '0.875rem',
            color: '#4a5568',
          }}
        >
          <strong>Status:</strong>{' '}
          {health.status === 'ok' ? (
            <>
              <span style={{ color: '#276749' }}>Backend OK</span>
              {' · '}
              {health.gemini_configured ? <span style={{ color: '#276749' }}>Gemini configured</span> : <span style={{ color: '#c53030' }}>Gemini missing</span>}
              {' · '}
              {health.supabase_configured ? <span style={{ color: '#276749' }}>Supabase connected</span> : <span style={{ color: '#c53030' }}>Supabase missing</span>}
            </>
          ) : (
            <span style={{ color: '#c53030' }}>Backend unreachable (start server on port 8000)</span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={loadAnalyses}
          disabled={loadingAnalyses}
          style={{
            padding: '8px 16px',
            fontSize: '0.875rem',
            cursor: loadingAnalyses ? 'not-allowed' : 'pointer',
            background: '#edf2f7',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
          }}
        >
          {loadingAnalyses ? 'Loading...' : 'Refresh from Supabase'}
        </button>
        <span style={{ fontSize: '0.8125rem', color: '#718096' }}>Data from Supabase only (AI analysis disabled)</span>
      </div>

      {/* Main table: analyses from Supabase */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.9375rem' }}>
          Analyses (Supabase)
        </div>
        {analyses === null ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>Loading…</div>
        ) : hasNoAnalyses ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              background: '#f7fafc',
              color: '#4a5568',
              fontSize: '0.9375rem',
              lineHeight: 1.5,
              border: '1px dashed #cbd5e0',
              margin: '1rem',
              borderRadius: 8,
            }}
          >
            {isBackendConnected
              ? 'Database connected. No analyses in Supabase yet. Add rows to the metadata_analyses table to see them here.'
              : 'Connect the backend and Supabase to see analyses here.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>Id</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>Old schema</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>New schema</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>Breaking</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>Summary</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a, i) => {
                  const rowId = a.id ?? `idx-${i}`
                  const isSelected = selectedRowId != null && (String(selectedRowId) === String(rowId) || selectedRowId === rowId)
                  return (
                    <tr
                      key={rowId}
                      onClick={() => selectRow(rowId)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? '#ebf8ff' : undefined,
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>{a.id ?? i + 1}</td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', maxWidth: 200, wordBreak: 'break-all' }}>{truncate(a.old_schema, 80)}</td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', maxWidth: 200, wordBreak: 'break-all' }}>{truncate(a.new_schema, 80)}</td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        {a.is_breaking ? <span style={{ color: '#c53030' }}>⚠️ Yes</span> : <span style={{ color: '#276749' }}>✅ No</span>}
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', maxWidth: 280 }}>{truncate(getSummaryDisplay(a.ai_summary), 120)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail: selected row full data */}
      {selectedRow && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Comparison detail</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#718096', marginBottom: '4px' }}>Old schema</div>
              <pre style={{ margin: 0, padding: '12px', background: '#f7fafc', borderRadius: 8, fontSize: '0.8125rem', overflow: 'auto', maxHeight: 200 }}>{typeof selectedRow.old_schema === 'string' ? selectedRow.old_schema : JSON.stringify(selectedRow.old_schema, null, 2)}</pre>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#718096', marginBottom: '4px' }}>New schema</div>
              <pre style={{ margin: 0, padding: '12px', background: '#f7fafc', borderRadius: 8, fontSize: '0.8125rem', overflow: 'auto', maxHeight: 200 }}>{typeof selectedRow.new_schema === 'string' ? selectedRow.new_schema : JSON.stringify(selectedRow.new_schema, null, 2)}</pre>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#718096', marginBottom: '4px' }}>Summary</div>
            <div style={{ padding: '12px', background: selectedRow.is_breaking ? '#fff5f5' : '#f0fff4', borderRadius: 8, fontSize: '0.9375rem', lineHeight: 1.5 }}>{getSummaryDisplay(selectedRow.ai_summary)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
