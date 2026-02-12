import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [oldSchema, setOldSchema] = useState('{"id": 1, "status": "active"}')
  const [newSchema, setNewSchema] = useState('{"id": "1", "status": "active", "archived": false}')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCompare = async () => {
    setLoading(true)
    setAnalysis(null)
    try {
      // Pointing to your local FastAPI server
      const response = await axios.post('http://localhost:8000/analyze', {
        old_schema: oldSchema,
        new_schema: newSchema
      })
      
      // Gemini often returns markdown code blocks, this cleans it up for parsing
      let cleanJson = response.data.analysis.replace(/```json/g, '').replace(/```/g, '')
      setAnalysis(JSON.parse(cleanJson))
    } catch (error) {
      console.error("Error analyzing:", error)
      alert("Analysis failed. Check console.")
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Metadata AI Analyzer</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <h3>Version 1 (Old)</h3>
          <textarea 
            value={oldSchema}
            onChange={(e) => setOldSchema(e.target.value)}
            rows={15}
            style={{ width: '100%', fontFamily: 'monospace', padding: '10px' }}
          />
        </div>
        <div>
          <h3>Version 2 (New)</h3>
          <textarea 
            value={newSchema}
            onChange={(e) => setNewSchema(e.target.value)}
            rows={15}
            style={{ width: '100%', fontFamily: 'monospace', padding: '10px' }}
          />
        </div>
      </div>

      <div style={{ margin: '2rem 0', textAlign: 'center' }}>
        <button 
          onClick={handleCompare} 
          disabled={loading}
          style={{ padding: '10px 30px', fontSize: '1.2rem', cursor: 'pointer' }}
        >
          {loading ? 'Analyzing with AI...' : 'Analyze Changes'}
        </button>
      </div>

      {analysis && (
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '2rem', 
          borderRadius: '8px',
          backgroundColor: analysis.is_breaking ? '#fff0f0' : '#f0fff4' 
        }}>
          <h2>Analysis Result</h2>
          <h3 style={{ color: analysis.is_breaking ? 'red' : 'green' }}>
            {analysis.is_breaking ? '⚠️ Breaking Change Detected' : '✅ Safe Update'}
          </h3>
          <p><strong>Summary:</strong> {analysis.summary}</p>
          <ul>
            {analysis.changes.map((change, idx) => (
              <li key={idx}>{change}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default App;
