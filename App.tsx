
import React, { useState, useEffect } from 'react';
import { SmartDocument, DocumentStatus, FieldType } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DocumentEditor from './components/DocumentEditor';
import SignerInterface from './components/SignerInterface';
import ShareModal from './components/ShareModal';
import SettingsView from './components/SettingsView';
import FileUploader from './components/FileUploader';

type AppView = 'dashboard' | 'editor' | 'signing' | 'archive' | 'settings' | 'uploader';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('dashboard');
  const [documents, setDocuments] = useState<SmartDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load documents from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('signsmart_docs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const formatted = parsed.map((doc: any) => ({
          ...doc,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt)
        }));
        setDocuments(formatted);
      } catch (e) {
        console.error("Failed to parse saved documents", e);
      }
    } else {
      const initialDocs: SmartDocument[] = [
        {
          id: 'demo-1', title: 'הסכם רכישה - פרויקט הרצליה', fileName: 'purchase_agreement.pdf',
          status: DocumentStatus.IN_PROGRESS, createdAt: new Date(), updatedAt: new Date(),
          signers: [{ id: 's1', name: 'אבי כהן', email: 'avi@test.com', phone: '0501234567', order: 1, hasSigned: false }],
          fields: [{ id: 'f1', type: FieldType.SIGNATURE, label: 'חתימה', page: 1, x: 50, y: 50, required: true, signerId: 's1' }],
          signingOrder: 'SEQUENTIAL', remindersEnabled: true,
          fileUrl: 'https://pdfobject.com/pdf/sample.pdf'
        }
      ];
      setDocuments(initialDocs);
    }
    setIsInitialLoading(false);
  }, []);

  // Check for signing link in URL (?sign=ID)
  useEffect(() => {
    if (isInitialLoading) return;
    
    const params = new URLSearchParams(window.location.search);
    const signId = params.get('sign');
    if (signId) {
      setSelectedId(signId);
      setView('signing');
    }
  }, [isInitialLoading, documents.length]);

  // Save documents to localStorage whenever they change
  useEffect(() => {
    if (!isInitialLoading && documents.length > 0) {
      localStorage.setItem('signsmart_docs', JSON.stringify(documents));
    }
  }, [documents, isInitialLoading]);

  const handleCreateClick = () => {
    setView('uploader');
  };

  const handleFileSelected = (file: File) => {
    const fileUrl = URL.createObjectURL(file);
    const newDoc: SmartDocument = {
      id: Math.random().toString(36).substr(2, 9),
      title: file.name.split('.')[0], 
      fileName: file.name,
      fileUrl: fileUrl,
      status: DocumentStatus.PENDING, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      signers: [{ id: 's-temp', name: 'חותם חדש', email: '', phone: '', order: 1, hasSigned: false }], 
      fields: [], 
      signingOrder: 'SEQUENTIAL', 
      remindersEnabled: true
    };
    setDocuments(prev => [newDoc, ...prev]);
    setSelectedId(newDoc.id);
    setView('editor');
  };

  const handleDocumentSave = (updated: SmartDocument) => {
    setDocuments(docs => docs.map(d => d.id === updated.id ? updated : d));
    setSelectedId(updated.id);
    setView('dashboard');
    setShowShareModal(true);
  };

  const currentDoc = documents.find(d => d.id === selectedId);
  const activeDocs = documents.filter(d => d.status !== DocumentStatus.COMPLETED);
  const archivedDocs = documents.filter(d => d.status === DocumentStatus.COMPLETED);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
      <Header 
        currentView={view === 'archive' || view === 'settings' ? view : 'dashboard'} 
        onViewChange={(v) => {
          if (v === 'dashboard') window.history.pushState({}, '', window.location.pathname);
          setView(v as AppView);
        }} 
        onCreateClick={handleCreateClick} 
      />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {isInitialLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold">טוען את המערכת...</p>
          </div>
        ) : (
          <>
            {view === 'dashboard' && (
              <Dashboard 
                documents={activeDocs} 
                onEdit={(id) => { setSelectedId(id); setView('editor'); }}
                onSign={(id) => { setSelectedId(id); setView('signing'); }}
                onDelete={(id) => {
                    if(confirm('האם אתה בטוח שברצונך למחוק את המסמך?')) {
                        setDocuments(docs => docs.filter(d => d.id !== id));
                    }
                }}
              />
            )}

            {view === 'uploader' && (
              <FileUploader 
                onFileSelected={handleFileSelected} 
                onCancel={() => setView('dashboard')} 
              />
            )}

            {view === 'archive' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold text-slate-800">ארכיון מסמכים חתומים</h2>
                  <p className="text-sm text-slate-500">צפה והורד מסמכים שתהליך החתימה שלהם הושלם.</p>
                </div>
                <Dashboard 
                  documents={archivedDocs} 
                  onEdit={() => {}} 
                  onSign={() => {}} 
                  onDelete={(id) => setDocuments(docs => docs.filter(d => d.id !== id))}
                />
              </div>
            )}

            {view === 'editor' && currentDoc && (
              <DocumentEditor 
                document={currentDoc} 
                onSave={handleDocumentSave} 
                onCancel={() => setView('dashboard')} 
              />
            )}

            {view === 'signing' && currentDoc ? (
              <SignerInterface 
                document={currentDoc} 
                onComplete={() => {
                  setDocuments(docs => docs.map(d => d.id === selectedId ? { ...d, status: DocumentStatus.COMPLETED } : d));
                  window.history.pushState({}, '', window.location.pathname);
                  setView('dashboard');
                }} 
              />
            ) : view === 'signing' && !isInitialLoading && (
               <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-red-100 max-w-lg mx-auto">
                 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl">✕</div>
                 <h2 className="text-xl font-bold text-slate-800">מסמך לא נמצא</h2>
                 <p className="text-slate-500 mt-2 text-center px-8">הקישור שהשתמשת בו אינו תקף, פג תוקפו או שהמסמך נמחק מהמערכת.</p>
                 <button onClick={() => {
                   window.history.pushState({}, '', window.location.pathname);
                   setView('dashboard');
                 }} className="mt-6 bg-slate-100 hover:bg-slate-200 px-6 py-2 rounded-xl text-slate-600 font-bold transition-all">חזרה לדף הבית</button>
               </div>
            )}

            {view === 'settings' && <SettingsView />}
          </>
        )}
      </main>

      {showShareModal && currentDoc && (
        <ShareModal 
          document={currentDoc} 
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </div>
  );
};

export default App;
