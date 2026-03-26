interface ReportModalProps {
  reportId: string;
  onClose: () => void;
}

export default function ReportModal({ reportId, onClose }: ReportModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-dark-blue">Sesizarea #{reportId}</h2>
            <span className="text-sm text-gray-400">Depusă de Ion Popescu la 27 Mar 2026, 09:30</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl leading-none">
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Descriere</span>
            <p className="text-sm text-gray-700 font-medium leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
              Groapă mare apărută pe trecerea de pietoni, reprezintă un pericol major pentru pietoni și bicicliști.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Fotografii Atașate</span>
            <div className="flex gap-4">
              <div className="w-32 h-32 bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-500 border border-gray-300">
                FOTO 1
              </div>
              <div className="w-32 h-32 bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-500 border border-gray-300">
                FOTO 2
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Locație</span>
              <span className="text-sm font-bold text-gray-700">Strada Brăilei nr. 15</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Contact Cetățean</span>
              <span className="text-sm font-bold text-gray-700">ion.popescu@email.com</span>
              <span className="text-sm font-bold text-gray-700">0722 123 456</span>
            </div>
          </div>

        </div>

        <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors">
            Închide
          </button>
        </div>

      </div>
    </div>
  );
}