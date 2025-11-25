/**
 * Analytics Debug Panel
 * 
 * Temporary component to help debug analytics issues.
 * Add this to SetbacksApp.jsx temporarily to see what's happening with analytics.
 * 
 * Usage:
 * import { AnalyticsDebugPanel } from './components/AnalyticsDebugPanel';
 * <AnalyticsDebugPanel />
 */

import { useState } from 'react';
import { GiraffeAdapter } from '../domain/GiraffeAdapter';
import { listAllMeasures, debugAnalyticsStructure, findMeasure } from '../utils/analyticsDebugger';
import { GIRAFFE_MEASURES } from '../constants/validationRules';

export const AnalyticsDebugPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [measures, setMeasures] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAndDebugAnalytics = async () => {
    setLoading(true);
    try {
      // Get analytics
      const result = await GiraffeAdapter.getAnalytics();
      setAnalytics(result);

      // Log full structure to console
      console.log('='.repeat(80));
      debugAnalyticsStructure(result);
      
      // List all measures
      const allMeasures = listAllMeasures(result);
      setMeasures(allMeasures);

      // Try to find each expected measure
      console.log('\n' + '='.repeat(80));
      console.log('🔎 SEARCHING FOR EXPECTED MEASURES:');
      console.log('='.repeat(80));
      
      Object.entries(GIRAFFE_MEASURES).forEach(([key, measureName]) => {
        findMeasure(result, measureName);
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const runQuickDebug = async () => {
    console.log('='.repeat(80));
    console.log('🚀 QUICK DEBUG - Check your console');
    console.log('='.repeat(80));
    await GiraffeAdapter.debugAnalytics();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#1a1a1a',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '16px',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '600px',
      overflow: 'auto',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    }}>
      <h3 style={{ margin: '0 0 12px 0', color: '#ff6b6b' }}>
        🔧 Analytics Debug Panel
      </h3>
      
      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={runQuickDebug}
          disabled={loading}
          style={{
            background: '#4dabf7',
            color: '#fff',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: loading ? 'wait' : 'pointer',
            marginRight: '8px',
            fontSize: '12px'
          }}
        >
          {loading ? '⏳ Loading...' : '🔍 Quick Debug'}
        </button>

        <button
          onClick={fetchAndDebugAnalytics}
          disabled={loading}
          style={{
            background: '#51cf66',
            color: '#fff',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: loading ? 'wait' : 'pointer',
            fontSize: '12px'
          }}
        >
          {loading ? '⏳ Loading...' : '📊 Full Debug'}
        </button>
      </div>

      {analytics && (
        <>
          <div style={{ 
            background: '#2d2d2d', 
            padding: '8px', 
            borderRadius: '4px',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#ffd43b' }}>Structure Check:</strong>
            <div style={{ marginTop: '4px' }}>
              ✓ Analytics: {analytics ? '✅' : '❌'}<br/>
              ✓ Has grouped: {analytics?.grouped ? '✅' : '❌'}<br/>
              ✓ Categories: {analytics?.grouped ? Object.keys(analytics.grouped).join(', ') : 'none'}<br/>
            </div>
          </div>

          {measures.length > 0 ? (
            <div style={{ 
              background: '#2d2d2d', 
              padding: '8px', 
              borderRadius: '4px'
            }}>
              <strong style={{ color: '#51cf66' }}>
                Found {measures.length} Measures:
              </strong>
              <div style={{ 
                marginTop: '8px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {measures.map((m, i) => (
                  <div key={i} style={{ 
                    padding: '4px',
                    borderBottom: '1px solid #444',
                    fontSize: '11px'
                  }}>
                    <div style={{ color: '#51cf66' }}>{m.measureName}</div>
                    <div style={{ color: '#999', fontSize: '10px' }}>
                      Category: {m.categoryId}<br/>
                      Usage: {m.usageName}<br/>
                      Value: {m.value ?? 'null'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ 
              background: '#2d2d2d', 
              padding: '8px', 
              borderRadius: '4px',
              color: '#ff6b6b'
            }}>
              ❌ No measures found!
            </div>
          )}
        </>
      )}

      <div style={{ 
        marginTop: '12px', 
        padding: '8px', 
        background: '#2d2d2d',
        borderRadius: '4px',
        fontSize: '10px',
        color: '#999'
      }}>
        💡 Check browser console (F12) for detailed logs
      </div>
    </div>
  );
};

