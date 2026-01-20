
import React from 'react';
import { SmartDocument, DocumentStatus } from '../types';
import { ICONS } from '../constants';

interface DashboardProps {
  documents: SmartDocument[];
  onEdit: (id: string) => void;
  onSign: (id: string) => void;
  onDelete: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ documents, onEdit, onSign, onDelete }) => {
  const getStatusBadge = (status: DocumentStatus) => {
    const styles = {
      [DocumentStatus.PENDING]: 'bg-slate-100 text-slate-600',
      [DocumentStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-600',
      [DocumentStatus.COMPLETED]: 'bg-green-100 text-green-600',
      [DocumentStatus.EXPIRED]: 'bg-red-100 text-red-600',
      [DocumentStatus.ESCALATED]: 'bg-amber-100 text-amber-600',
    };
    const labels = {
      [DocumentStatus.PENDING]: 'טיוטה',
      [DocumentStatus.IN_PROGRESS]: 'ממתין לחתימה',
      [DocumentStatus.COMPLETED]: 'נחתם',
      [DocumentStatus.EXPIRED]: 'פג תוקף',
      [DocumentStatus.ESCALATED]: 'הסלמה',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'סה"כ מסמכים', val: documents.length, color: 'border-b-4 border-slate-200' },
          { label: 'בתהליך חתימה', val: documents.filter(d => d.status === DocumentStatus.IN_PROGRESS).length, color: 'border-b-4 border-blue-500' },
          { label: 'הושלמו', val: documents.filter(d => d.status === DocumentStatus.COMPLETED).length, color: 'border-b-4 border-green-500' },
          { label: 'דורשים טיפול', val: documents.filter(d => d.status === DocumentStatus.ESCALATED).length, color: 'border-b-4 border-amber-500' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${stat.color}`}>
            <p className="text-sm text-slate-500 font-medium mb-1">{stat.label}</p>
            <p className="text-3xl font-extrabold text-slate-800">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">המסמכים שלי</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">שם המסמך</th>
                <th className="px-6 py-4 text-center">סטטוס</th>
                <th className="px-6 py-4 text-center">חותמים</th>
                <th className="px-6 py-4">תאריך</th>
                <th className="px-6 py-4">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><ICONS.File className="w-5 h-5" /></div>
                      <div>
                        <p className="font-bold text-slate-700">{doc.title}</p>
                        <p className="text-xs text-slate-400">{doc.fileName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">{getStatusBadge(doc.status)}</td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center -space-x-2 space-x-reverse">
                      {doc.signers.map((s, i) => (
                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${s.hasSigned ? 'bg-green-500' : 'bg-slate-400'}`} title={s.name}>
                          {s.name[0]}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-500">
                    {new Intl.DateTimeFormat('he-IL').format(doc.createdAt)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onSign(doc.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="חתימה"><ICONS.Check className="w-5 h-5" /></button>
                      <button onClick={() => onEdit(doc.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="עריכה"><ICONS.Edit className="w-5 h-5" /></button>
                      <button onClick={() => onDelete(doc.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="מחיקה"><ICONS.Trash className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
