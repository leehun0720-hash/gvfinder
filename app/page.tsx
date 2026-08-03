"use client";

import { useState, useRef, useEffect } from 'react';
import { Upload, Bell, Search, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Settings Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
      setApiKeyInput(savedKey);
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('geminiApiKey', apiKeyInput);
    setShowSettings(false);
    alert("설정이 저장되었습니다.");
  };

  const getHeaders = () => {
    const headers: Record<string, string> = {};
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
      headers['X-Gemini-Key'] = savedKey;
    }
    return headers;
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/contracts/matches', { headers: getHeaders() });
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const res = await fetch('/api/pdf/upload', {
          method: 'POST',
          headers: getHeaders(),
          body: formData,
        });
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/contracts/sync', { 
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        alert(`새로운 공고 ${data.syncedContracts}건이 동기화되었고, ${data.newMatches}건의 새로운 매칭이 발견되었습니다.`);
        fetchMatches();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/contracts/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      setSearchResults(data.contracts || []);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container" style={{ position: 'relative' }}>
      {showSettings && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px',
            width: '90%', maxWidth: '400px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>⚙️ 시스템 설정</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Gemini API Key</label>
              <input 
                type="password" 
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff' }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>브라우저(로컬)에만 안전하게 저장됩니다.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setShowSettings(false)} className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}>취소</button>
              <button onClick={saveSettings} className="btn">저장</button>
            </div>
          </div>
        </div>
      )}

      <header className="dashboard-header">
        <h1 className="dashboard-title">국비 공모 파인더</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={() => setShowSettings(true)} style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}>
            ⚙️ 설정
          </button>
          <button className="btn" onClick={handleSync} disabled={syncing}>
            {syncing ? <div className="loading-spinner"></div> : <RefreshCw size={18} />}
            공고 동기화 (보조금통합, 지방재정365)
          </button>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <h2 className="card-title"><FileText size={20} /> 지식창고 (PDF 업로드)</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            과거 사업 제안서나 회사 소개서를 업로드하면 AI가 핵심 역량을 학습합니다.
          </p>
          
          <div 
            className="upload-zone" 
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".pdf" 
              hidden 
              ref={fileInputRef} 
              onChange={handleUpload} 
            />
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div className="loading-spinner" style={{ borderColor: 'var(--primary-color)', borderTopColor: 'transparent', width: '32px', height: '32px' }}></div>
                <p>AI가 문서를 분석하고 있습니다...</p>
              </div>
            ) : (
              <div>
                <Upload size={32} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
                <p>{file ? file.name : "클릭하여 PDF 파일 업로드"}</p>
              </div>
            )}
          </div>

          {profile && (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="var(--accent-color)" /> 추출된 프로필
              </h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{profile.summary}</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {profile.targetCategories?.map((cat: string, i: number) => (
                  <span key={i} className="badge">{cat}</span>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {profile.keyCapabilities?.map((cap: string, i: number) => (
                  <span key={i} className="badge badge-success">{cap}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}><Bell size={20} /> 맞춤형 공모 알림</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            학습된 프로필을 바탕으로 추천된 정부/지자체 공모 사업입니다.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {matches.length > 0 ? (
              matches.map((match, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', backgroundColor: match.score >= 90 ? 'rgba(16, 185, 129, 0.05)' : 'var(--card-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="badge">{match.contract.sourcePortal}</span>
                    <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{match.score}% 일치</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{match.contract.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {match.contract.department} • {match.contract.description}
                  </p>
                  <div style={{ fontSize: '0.875rem', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <strong style={{ color: '#60a5fa' }}>AI 매칭 사유:</strong> {match.reason}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                우측 상단의 '공고 동기화' 버튼을 눌러 공모 사업을 가져오면 AI가 매칭을 시작합니다.
              </div>
            )}
          </div>
        </section>

        {/* Search Section */}
        <section className="card" style={{ gridColumn: 'span 3', marginTop: '1rem' }}>
          <h2 className="card-title"><Search size={20} /> 공모 과제 전체 검색</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            등록된 모든 정부 및 지자체 공모사업을 직접 검색해보세요.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder="검색어를 입력하세요 (예: 데이터, AI, 청년...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: '#fff' }}
            />
            <button type="submit" className="btn" disabled={isSearching}>
              {isSearching ? <div className="loading-spinner"></div> : <Search size={18} />}
              검색
            </button>
          </form>

          {searchResults.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {searchResults.map((contract) => (
                <div key={contract.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', backgroundColor: 'var(--card-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="badge">{contract.sourcePortal}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{contract.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    {contract.department}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
                    {contract.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            searchQuery && !isSearching && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                검색 결과가 없습니다.
              </div>
            )
          )}
        </section>
      </main>
    </div>
  );
}
