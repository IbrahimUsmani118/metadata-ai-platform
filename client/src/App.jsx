import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE = '/api'

function truncate(str, max = 60) {
  const s = typeof str === 'string' ? str : JSON.stringify(str ?? '')
  return s.length <= max ? s : s.slice(0, max) + '…'
}

function parseAiSummary(raw) {
  const str = raw ?? ''
  if (typeof str !== 'string') return String(str)
  const trimmed = str.trim()
  if (!trimmed) return '—'
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
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

function StatusBadge({ ok, label }) {
  return (
    <span style={{ color: ok ? '#276749' : '#c53030' }}>
      {ok ? '✓' : '✗'} {label}
    </span>
  )
}

function ErrorMessage({ message, onDismiss }) {
  if (!message) return null
  return (
    <div
      style={{
        padding: '12px 16px',
        background: '#fff5f5',
        border: '1px solid #fc8181',
        borderRadius: 8,
        color: '#c53030',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#c53030',
            cursor: 'pointer',
            fontSize: '1.25rem',
            padding: '0 4px',
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

function AnalyzeForm({ onSuccess, disabled }) {
  const [oldSchema, setOldSchema] = useState('')
  const [newSchema, setNewSchema] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!oldSchema.trim() || !newSchema.trim()) {
      setError('Both schemas are required')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await axios.post(`${API_BASE}/analyze`, {
        old_schema: oldSchema.trim(),
        new_schema: newSchema.trim(),
      })
      setResult(response.data)
      onSuccess?.()
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Failed to analyze schemas'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setOldSchema('')
    setNewSchema('')
    setResult(null)
    setError(null)
  }

  const placeholderOld = '{"name": "string", "age": "number"}'
  const placeholderNew = '{"name": "string", "email": "string"}'

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        marginBottom: '1.5rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          fontWeight: 600,
          fontSize: '0.9375rem',
        }}
      >
        Compare Schemas
      </div>
      <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#718096',
                marginBottom: '4px',
              }}
            >
              Old Schema (JSON)
            </label>
            <textarea
              value={oldSchema}
              onChange={(e) => setOldSchema(e.target.value)}
              placeholder={placeholderOld}
              disabled={disabled || loading}
              rows={5}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                background: disabled ? '#f7fafc' : '#fff',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#718096',
                marginBottom: '4px',
              }}
            >
              New Schema (JSON)
            </label>
            <textarea
              value={newSchema}
              onChange={(e) => setNewSchema(e.target.value)}
              placeholder={placeholderNew}
              disabled={disabled || loading}
              rows={5}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                background: disabled ? '#f7fafc' : '#fff',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="submit"
            disabled={disabled || loading || !oldSchema.trim() || !newSchema.trim()}
            style={{
              padding: '8px 20px',
              background: disabled ? '#e2e8f0' : '#3182ce',
              color: disabled ? '#718096' : '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 500,
              cursor: disabled || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze with AI'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
            }}
          >
            Clear
          </button>
        </div>

        {disabled && (
          <p
            style={{
              margin: '0.75rem 0 0',
              fontSize: '0.8125rem',
              color: '#718096',
            }}
          >
            Configure Gemini API key to enable AI analysis.
          </p>
        )}

        {result && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              background: result.is_breaking ? '#fff5f5' : '#f0fff4',
              borderRadius: 8,
              border: `1px solid ${result.is_breaking ? '#fc8181' : '#9ae6b4'}`,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: result.is_breaking ? '#c53030' : '#276749',
              }}
            >
              {result.is_breaking ? '⚠️ Breaking Change Detected' : '✓ No Breaking Changes'}
            </div>
            <div style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>
              {result.summary || parseAiSummary(JSON.stringify(result))}
            </div>
            {result.changes && result.changes.length > 0 && (
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                {result.changes.map((change, i) => (
                  <li key={i} style={{ fontSize: '0.875rem' }}>
                    {change}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    </div>
  )
}

function App() {
  const [analyses, setAnalyses] = useState(null)
  const [loadingAnalyses, setLoadingAnalyses] = useState(false)
  const [health, setHealth] = useState(null)
  const [selectedRowId, setSelectedRowId] = useState(null)
  const [error, setError] = useState(null)

  const loadAnalyses = useCallback(async () => {
    setLoadingAnalyses(true)
    setError(null)
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
    } catch (err) {
      console.error(err)
      setAnalyses([])
      setError('Failed to load analyses from database.')
    }
    setLoadingAnalyses(false)
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const r = await axios.get(`${API_BASE}/health`)
        setHealth(r.data)
      } catch {
        setHealth({ status: 'error' })
      }
      await loadAnalyses()
    }
    init()
  }, [loadAnalyses])

  const selectRow = (id) => {
    setSelectedRowId((prev) => (prev === id ? null : id))
  }

  const isBackendConnected = health?.status === 'ok'
  const isGeminiConfigured = health?.gemini_configured
  const hasNoAnalyses = Array.isArray(analyses) && analyses.length === 0
  const list = analyses ?? []
  const selectedRow =
    selectedRowId != null
      ? list.find(
          (a) => a.id === selectedRowId || String(a.id) === String(selectedRowId)
        )
      : null

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '1.5rem 2rem' }}>
      <h1
        style={{
          margin: '0 0 1rem',
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#1a202c',
        }}
      >
        Metadata AI Platform
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
              <StatusBadge ok={true} label="Backend" />
              {' · '}
              <StatusBadge ok={health.gemini_configured} label="Gemini" />
              {' · '}
              <StatusBadge ok={health.supabase_configured} label="Supabase" />
            </>
          ) : (
            <span style={{ color: '#c53030' }}>
              Backend unreachable — start server on port 8000
            </span>
          )}
        </div>
      )}

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      <AnalyzeForm
        onSuccess={loadAnalyses}
        disabled={!isBackendConnected || !isGeminiConfigured}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
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
          {loadingAnalyses ? 'Loading...' : 'Refresh'}
        </button>
        <span style={{ fontSize: '0.8125rem', color: '#718096' }}>
          {list.length} {list.length === 1 ? 'analysis' : 'analyses'} stored
        </span>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            fontWeight: 600,
            fontSize: '0.9375rem',
          }}
        >
          Analysis History
        </div>
        {analyses === null ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
            Loading…
          </div>
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
              ? 'No analyses yet. Use the form above to compare schemas.'
              : 'Connect the backend to view and create analyses.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>
                    Id
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>
                    Old schema
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>
                    New schema
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>
                    Breaking
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>
                    Summary
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((a, i) => {
                  const rowId = a.id ?? `idx-${i}`
                  const isSelected =
                    selectedRowId != null &&
                    (String(selectedRowId) === String(rowId) || selectedRowId === rowId)
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
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        {a.id ?? i + 1}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          verticalAlign: 'top',
                          maxWidth: 200,
                          wordBreak: 'break-all',
                        }}
                      >
                        {truncate(a.old_schema, 80)}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          verticalAlign: 'top',
                          maxWidth: 200,
                          wordBreak: 'break-all',
                        }}
                      >
                        {truncate(a.new_schema, 80)}
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        {a.is_breaking ? (
                          <span style={{ color: '#c53030' }}>⚠️ Yes</span>
                        ) : (
                          <span style={{ color: '#276749' }}>✓ No</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', maxWidth: 280 }}>
                        {truncate(parseAiSummary(a.ai_summary), 120)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Comparison Detail</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#718096',
                  marginBottom: '4px',
                }}
              >
                Old schema
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '12px',
                  background: '#f7fafc',
                  borderRadius: 8,
                  fontSize: '0.8125rem',
                  overflow: 'auto',
                  maxHeight: 200,
                }}
              >
                {typeof selectedRow.old_schema === 'string'
                  ? selectedRow.old_schema
                  : JSON.stringify(selectedRow.old_schema, null, 2)}
              </pre>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#718096',
                  marginBottom: '4px',
                }}
              >
                New schema
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '12px',
                  background: '#f7fafc',
                  borderRadius: 8,
                  fontSize: '0.8125rem',
                  overflow: 'auto',
                  maxHeight: 200,
                }}
              >
                {typeof selectedRow.new_schema === 'string'
                  ? selectedRow.new_schema
                  : JSON.stringify(selectedRow.new_schema, null, 2)}
              </pre>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#718096',
                marginBottom: '4px',
              }}
            >
              AI Analysis
            </div>
            <div
              style={{
                padding: '12px',
                background: selectedRow.is_breaking ? '#fff5f5' : '#f0fff4',
                borderRadius: 8,
                fontSize: '0.9375rem',
                lineHeight: 1.5,
              }}
            >
              {parseAiSummary(selectedRow.ai_summary)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
