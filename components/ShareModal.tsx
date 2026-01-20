import React, { useState } from 'react';
import { SmartDocument, Signer } from '../types';
import { ICONS } from '../constants';

interface ShareModalProps {
  document: SmartDocument;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ document, onClose }) => {
  const [selectedSigner, setSelectedSigner] = useState<Signer | null>(document.signers[0] || null);
  const [copied, setCopied] = useState(false);

  const getSigningLink = () => {
    // We use the current full URL and strip any existing query parameters
    // to ensure the base URL is absolutely correct and includes the protocol correctly.
    const baseUrl = window.location.href.split('?')[0];
    return `${baseUrl}?sign=${document.id}`;
  };

  const copyToClipboard = () => {
    const link = getSigningLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      // Fallback for browsers that don't support clipboard API in certain contexts
      // Use window.document to avoid shadowing by the component's 'document' prop
      // Fix: Property 'createElement' does not exist on type 'SmartDocument'
      const input = window.document.createElement('input');
      input.value = link;
      // Fix: Property 'body' does not exist on type 'SmartDocument'
      window.document.body.appendChild(input);
      input.select();
      // Fix: Property 'execCommand' does not exist on type 'SmartDocument'
      window.document.execCommand('copy');
      // Fix: Property 'body' does not exist on type 'SmartDocument'
      window.document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getWhatsAppUrl = () => {
    if (!selectedSigner) return '';
    const text = `שלום ${selectedSigner.name}, מצורף קישור לחתימה על המסמך "${document.title}": ${getSigningLink()}`;
    return `https://wa.me/${selectedSigner.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  };

  const getEmailUrl = () => {
    if (!selectedSigner) return '';
    const subject = encodeURIComponent(`בקשה לחתימה: ${document.title}`);
    const body = encodeURIComponent(`שלום ${selectedSigner.name},\n\nנא חתום על המסמך בקישור הבא:\n${getSigningLink()}\n\nבברכה,\nצוות SignSmart`);
    return `mailto:${selectedSigner.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-slide-up overflow-hidden border border-white/20">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">הפצת מסמך לחתימה</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">✕</button>
        </div>
        
        <div className="p-8 space-y-6">
          {/* Direct Link Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">קישור ישיר לחתימה</label>
            <div className="flex gap-2">
              <input 
                readOnly 
                value={getSigningLink()} 
                className="flex-grow p-3 bg-slate-100 rounded-xl text-xs font-mono border-2 border-slate-100 focus:outline-none text-slate-600"
              />
              <button 
                onClick={copyToClipboard}
                className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap shadow-sm ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {copied ? <ICONS.Check className="w-4 h-4" /> : 'העתק'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">בחר חותם למשלוח הודעה</label>
            <div className="grid grid-cols-1 gap-2">
              {document.signers.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setSelectedSigner(s)}
                  className={`p-4 border-2 rounded-2xl flex items-center justify-between transition-all text-right ${selectedSigner?.id === s.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div>
                    <p className="font-bold text-slate-700">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.phone} | {s.email}</p>
                  </div>
                  {selectedSigner?.id === s.id && <div className="bg-blue-500 rounded-full p-1 text-white"><ICONS.Check className="w-4 h-4" /></div>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <a 
              href={getWhatsAppUrl()} 
              target="_blank" 
              className="flex flex-col items-center gap-3 p-6 border-2 border-slate-100 rounded-3xl hover:border-green-500 hover:bg-green-50 transition-all group no-underline"
            >
              <div className="p-4 bg-green-100 text-green-600 rounded-2xl group-hover:scale-110 transition-transform">
                <ICONS.Phone className="w-8 h-8" />
              </div>
              <span className="font-bold text-slate-700 text-sm">בוואטסאפ</span>
            </a>
            
            <a 
              href={getEmailUrl()}
              className="flex flex-col items-center gap-3 p-6 border-2 border-slate-100 rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all group no-underline"
            >
              <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <ICONS.Mail className="w-8 h-8" />
              </div>
              <span className="font-bold text-slate-700 text-sm">במייל</span>
            </a>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 border-t flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold">
          <ICONS.Alert className="w-4 h-4" />
          <span>הקישור פתוח ופעיל לחתימה ישירה מהסמארטפון או המחשב.</span>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;