import React, { useState, useEffect } from 'react';
import { Bug, Eye, EyeOff } from 'lucide-react';

export const UTMDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [utmData, setUtmData] = useState<Record<string, string>>({});
  const [urlParams, setUrlParams] = useState<Record<string, string>>({});

  useEffect(() => {
    // Coleta dados do localStorage
    const localStorageData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('utm_')) {
        localStorageData[key] = localStorage.getItem(key) || '';
      }
    }
    setUtmData(localStorageData);

    // Coleta dados da URL atual
    const currentUrlParams: Record<string, string> = {};
    const urlSearchParams = new URLSearchParams(window.location.search);
    const utmKeys = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 
      'click_id', 'fbclid', 'gclid', 'src', 'sck', 'gad_source', 'utm_id',
      'ttclid', 'msclkid', 'twclid', 'li_fat_id'
    ];
    
    utmKeys.forEach(key => {
      const value = urlSearchParams.get(key);
      if (value) {
        currentUrlParams[key] = value;
      }
    });
    setUrlParams(currentUrlParams);
  }, []);

  // Só mostra o debugger em desenvolvimento ou se tiver ?debug=utm na URL
  const shouldShow = window.location.search.includes('debug=utm') || 
                    window.location.hostname === 'localhost' ||
                    window.location.hostname.includes('bolt.new');

  if (!shouldShow) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="UTM Debugger"
      >
        <Bug className="w-4 h-4" />
      </button>

      {isVisible && (
        <div className="absolute top-12 right-0 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 flex items-center">
              <Bug className="w-4 h-4 mr-2" />
              UTM Debugger
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                📦 LocalStorage (Capturadas):
              </h4>
              {Object.keys(utmData).length > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  {Object.entries(utmData).map(([key, value]) => (
                    <div key={key} className="text-xs mb-1">
                      <span className="font-mono text-green-700">{key}:</span>
                      <span className="ml-2 text-green-800">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-600">
                  Nenhuma UTM capturada no localStorage
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                🔗 URL Atual:
              </h4>
              {Object.keys(urlParams).length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  {Object.entries(urlParams).map(([key, value]) => (
                    <div key={key} className="text-xs mb-1">
                      <span className="font-mono text-blue-700">{key}:</span>
                      <span className="ml-2 text-blue-800">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-600">
                  Nenhum parâmetro UTM na URL atual
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                💡 Para testar, adicione parâmetros como:<br/>
                <code className="bg-gray-100 px-1 rounded">?utm_source=test&click_id=123</code>
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  localStorage.clear();
                  setUtmData({});
                  console.log('LEK DO BLACK: localStorage limpo!');
                }}
                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
              >
                Limpar Storage
              </button>
              <button
                onClick={() => {
                  console.log('=== UTM DEBUG REPORT ===');
                  console.log('LocalStorage UTMs:', utmData);
                  console.log('URL UTMs:', urlParams);
                  console.log('Current URL:', window.location.href);
                }}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
              >
                Log Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};