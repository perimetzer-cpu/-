
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SmartDocument, FieldType, DocumentField, Signer, DocumentStatus } from '../types';
import { ICONS } from '../constants';
import PDFViewer from './PDFViewer';

interface DocumentEditorProps {
  document: SmartDocument;
  onSave: (doc: SmartDocument) => void;
  onCancel: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ document: initialDoc, onSave, onCancel }) => {
  const [doc, setDoc] = useState<SmartDocument>(initialDoc);
  const [activeTab, setActiveTab] = useState<'fields' | 'signers' | 'settings'>('fields');
  const [draggedFieldType, setDraggedFieldType] = useState<FieldType | null>(null);
  const [movingFieldId, setMovingFieldId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fileType = useMemo(() => {
    const ext = doc.fileName?.toLowerCase().split('.').pop();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return 'image';
    return 'other';
  }, [doc.fileName]);

  const addSigner = () => {
    const newSigner: Signer = {
      id: Math.random().toString(36).substr(2, 5),
      name: '', email: '', phone: '',
      order: doc.signers.length + 1,
      hasSigned: false
    };
    setDoc({ ...doc, signers: [...doc.signers, newSigner] });
  };

  const updateSigner = (id: string, updates: Partial<Signer>) => {
    setDoc({ ...doc, signers: doc.signers.map(s => s.id === id ? { ...s, ...updates } : s) });
  };

  const addField = (x: number, y: number, type: FieldType) => {
    if (doc.signers.length === 0) {
      alert('יש להוסיף לפחות חותם אחד לפני הוספת שדות');
      return;
    }
    const newField: DocumentField = {
      id: Math.random().toString(36).substr(2, 5),
      type, label: getLabel(type),
      page: 1, x, y, required: true,
      signerId: doc.signers[0].id
    };
    setDoc({ ...doc, fields: [...doc.fields, newField] });
  };

  const getLabel = (type: FieldType) => {
    switch(type) {
      case FieldType.SIGNATURE: return 'חתימה';
      case FieldType.INITIALS: return 'ראשי תיבות';
      case FieldType.DATE: return 'תאריך';
      case FieldType.ID_NUMBER: return 'ת.ז.';
      case FieldType.ADDRESS: return 'כתובת';
      case FieldType.AMOUNT: return 'סכום';
      case FieldType.CHECKBOX: return 'אישור תנאים';
      default: return 'שדה';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!movingFieldId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setDoc(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === movingFieldId ? { ...f, x, y } : f)
    }));
  };

  const handleMouseUp = () => {
    setMovingFieldId(null);
  };

  // Ensure move ends even if mouse leaves the document area
  useEffect(() => {
    if (movingFieldId) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [movingFieldId]);

  const fieldTemplates = [
    { type: FieldType.SIGNATURE, label: 'חתימה', icon: <ICONS.Check className="w-4 h-4" /> },
    { type: FieldType.INITIALS, label: 'ראשי תיבות', icon: <span className="text-[10px] font-bold">RT</span> },
    { type: FieldType.DATE, label: 'תאריך', icon: <ICONS.Plus className="w-4 h-4 rotate-45" /> },
    { type: FieldType.ID_NUMBER, label: 'ת.ז.', icon: <ICONS.Logo className="w-4 h-4" /> },
    { type: FieldType.ADDRESS, label: 'כתובת', icon: <ICONS.Plus className="w-4 h-4" /> },
    { type: FieldType.AMOUNT, label: 'סכום', icon: <span className="font-bold">₪</span> },
    { type: FieldType.CHECKBOX, label: 'צ\'קבוקס', icon: <div className="w-3 h-3 border-2 border-slate-400"></div> },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-bold px-4 transition-colors">ביטול</button>
          <div className="h-8 w-px bg-slate-100"></div>
          <div className="flex flex-col">
            <input 
              type="text" 
              value={doc.title}
              onChange={(e) => setDoc({ ...doc, title: e.target.value })}
              className="text-lg font-bold bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none px-2 py-0.5 min-w-[250px]"
            />
            <span className="text-[10px] text-slate-400 font-bold px-2 flex items-center gap-1">
              <ICONS.File className="w-3 h-3" /> {doc.fileName}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onSave({ ...doc, status: DocumentStatus.IN_PROGRESS })}
            className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            סיום ושליחה
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-grow overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden">
          <div className="flex border-b bg-slate-50/50">
            {['fields', 'signers', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-400'}`}
              >
                {tab === 'fields' ? 'שדות' : tab === 'signers' ? 'חותמים' : 'אוטומציה'}
              </button>
            ))}
          </div>

          <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'fields' && (
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">גרור למסמך או לחץ להוספה מהירה</p>
                <div className="grid grid-cols-1 gap-2">
                  {fieldTemplates.map((template) => (
                    <div
                      key={template.type}
                      className="group flex items-center gap-2 p-1 pr-3 border-2 border-slate-50 rounded-2xl hover:border-blue-100 hover:bg-blue-50 transition-all bg-white"
                    >
                      <div 
                        draggable
                        onDragStart={() => setDraggedFieldType(template.type)}
                        className="flex-grow flex items-center gap-3 cursor-move py-2"
                      >
                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white text-slate-400 group-hover:text-blue-600 transition-colors shadow-sm">{template.icon}</div>
                        <span className="text-xs font-bold text-slate-600">{template.label}</span>
                      </div>
                      <button 
                        onClick={() => addField(50, 50, template.type)}
                        className="p-2 opacity-0 group-hover:opacity-100 bg-blue-600 text-white rounded-xl text-[9px] font-bold shadow-md hover:bg-blue-700 transition-all"
                        title="הוסף למרכז (50, 50)"
                      >
                        מרכז
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'signers' && (
              <div className="space-y-3">
                {doc.signers.map((signer, i) => (
                  <div key={signer.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">{i+1}</span>
                      <button onClick={() => setDoc({...doc, signers: doc.signers.filter(s => s.id !== signer.id)})} className="text-slate-300 hover:text-red-500">✕</button>
                    </div>
                    <input 
                      type="text" placeholder="שם החותם" value={signer.name}
                      onChange={(e) => updateSigner(signer.id, { name: e.target.value })}
                      className="text-xs font-bold w-full bg-white border p-2 rounded-lg mb-2 outline-none focus:border-blue-300"
                    />
                    <input 
                      type="email" placeholder="אימייל" value={signer.email}
                      onChange={(e) => updateSigner(signer.id, { email: e.target.value })}
                      className="text-[10px] w-full bg-white border p-2 rounded-lg outline-none focus:border-blue-300"
                    />
                  </div>
                ))}
                <button onClick={addSigner} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs hover:border-blue-400 hover:text-blue-600 transition-all">+ חותם נוסף</button>
              </div>
            )}
          </div>
        </div>

        {/* Document Area */}
        <div 
          className={`flex-grow bg-slate-200 rounded-2xl border shadow-inner overflow-auto flex justify-center p-8 custom-scrollbar ${movingFieldId ? 'cursor-grabbing' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div 
            ref={containerRef}
            className="w-[620px] relative h-fit"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              if (draggedFieldType) addField(x, y, draggedFieldType);
              setDraggedFieldType(null);
            }}
          >
            {doc.fileUrl && fileType === 'pdf' ? (
              <PDFViewer fileUrl={doc.fileUrl}>
                {/* Fields Overlay within PDFViewer */}
                {doc.fields.map((field) => (
                  <div
                    key={field.id}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setMovingFieldId(field.id);
                    }}
                    style={{ left: `${field.x}%`, top: `${field.y}%`, transform: 'translate(-50%, -50%)' }}
                    className={`absolute p-2 bg-white/95 border-2 border-blue-600 rounded-xl flex items-center gap-2 shadow-xl z-20 pointer-events-auto transition-transform ${movingFieldId === field.id ? 'scale-110 opacity-70 z-30 cursor-grabbing' : 'hover:scale-105 cursor-grab'}`}
                  >
                    <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm">
                      <ICONS.Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-[60px] select-none">
                       <span className="text-[7px] text-blue-500 font-extrabold uppercase tracking-tighter leading-none mb-1">
                          {doc.signers.find(s => s.id === field.signerId)?.name || 'חותם'}
                       </span>
                       <div className="text-[10px] font-extrabold text-blue-900 leading-none">{field.label}</div>
                    </div>
                    <button 
                      onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking delete
                      onClick={(e) => {
                        e.stopPropagation();
                        setDoc({...doc, fields: doc.fields.filter(f => f.id !== field.id)});
                      }} 
                      className="w-5 h-5 bg-slate-100 hover:bg-red-500 hover:text-white rounded-full text-slate-400 flex items-center justify-center text-[8px] transition-colors shadow-sm"
                    >✕</button>
                  </div>
                ))}
              </PDFViewer>
            ) : (
              <div className="w-full aspect-[1/1.4] bg-white rounded-sm border shadow-md flex items-center justify-center">
                <p className="text-slate-400 font-bold">טוען מסמך...</p>
              </div>
            )}

            {/* Visual Aid Overlay when dragging from side menu */}
            {draggedFieldType && (
              <div className="absolute inset-0 z-40 bg-blue-500/10 backdrop-blur-[2px] pointer-events-none flex items-center justify-center border-4 border-blue-500/30 transition-all">
                <div className="bg-white px-8 py-4 rounded-[30px] shadow-2xl border border-blue-100 flex items-center gap-3 scale-110">
                  <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                    <ICONS.Plus className="w-6 h-6" />
                  </div>
                  <p className="text-blue-900 font-extrabold text-lg">שחרר למיקום השדה</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
