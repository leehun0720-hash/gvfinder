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

  const fetchMatches = async () => {
    // For this prototype, we'll fetch matches from a new API route or we could just use state.
    // Let's create an API route to fetch data if needed, or we just rely on state here.
  };

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
      const res = await fetch('/api/contracts/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`새로운 공고 ${data.syncedContracts}건이 동기화되었고, ${data.newMatches}건의 새로운 매칭이 발견되었습니다.`);
        // Here we ideally fetch matches from DB. For now, we'll just mock the matches state
        // to show something in the UI since we don't have a GET endpoint yet.
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">국비 공모 파인더</h1>
        <div>
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
          <h2 className="card-title"><Bell size={20} /> 맞춤형 공모 알림</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            학습된 프로필을 바탕으로 추천된 정부/지자체 공모 사업입니다.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Mock match for UI display */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="badge">보조금통합포털</span>
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>92% 일치</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>2026년 지자체 행정 AI 전환 지원사업 공모</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                행정안전부 • 지자체 행정업무의 AI(AX) 도입을 지원하는 보조금 사업입니다.
              </p>
              <div style={{ fontSize: '0.875rem', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <strong style={{ color: '#60a5fa' }}>AI 매칭 사유:</strong> 귀사의 &apos;AI 기반 행정 전환(AX)&apos; 역량과 정확히 일치하는 공모입니다.
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="badge">지방재정365</span>
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>85% 일치</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>데이터 기반 스마트시티 조성 용역</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                전라남도 • 지역 맞춤형 데이터 솔루션 및 스마트시티 인프라 구축 공모
              </p>
              <div style={{ fontSize: '0.875rem', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <strong style={{ color: '#60a5fa' }}>AI 매칭 사유:</strong> &apos;데이터 솔루션 구축 역량&apos; 및 &apos;스마트시티&apos; 관심 분야와 부합합니다.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
