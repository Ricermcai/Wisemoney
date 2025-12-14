
import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, X, Database, CheckCircle, Copy, Trash2, Loader2, FileDown, TrendingUp, BookHeart, Clock } from 'lucide-react';
import { StorageService } from '../services/storage';
import { AppData } from '../types';

interface DataManagerProps {
  onClose: () => void;
}

export const DataManager: React.FC<DataManagerProps> = ({ onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Real-time stats state
  const [stats, setStats] = useState<{tx: number, journal: number, ts: number} | null>(null);

  useEffect(() => {
    // Load fresh data from StorageService (which merges LocalStorage + InitialData)
    const db = StorageService.getDB();
    setStats({
        tx: db.ledger.transactions.length,
        journal: db.journal.length,
        ts: db.timestamp
    });
  }, []);

  const handleExportJSON = () => {
    try {
      const db = StorageService.getDB();
      const jsonString = JSON.stringify(db, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const filename = `moneys-wisdom-backup-${now.toISOString().split('T')[0]}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("导出失败");
    }
  };

  const handleDownloadTS = () => {
      try {
        const db = StorageService.getDB();
        
        const tsContent = `import { AppData } from '@/types';

/**
 * 核心数据文件 (Master Data File)
 * 
 * 用户的个人历史数据备份。
 * 导出时间: ${new Date().toLocaleString()}
 */

export const INITIAL_DATA: AppData = ${JSON.stringify(db, null, 2)};
`;

        const blob = new Blob([tsContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'initialData.ts';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (e) {
        alert("下载失败");
      }
  };

  const handleCopyForCodebase = () => {
      const db = StorageService.getDB();
      const tsContent = `export const INITIAL_DATA: AppData = ${JSON.stringify(db, null, 2)};`;
      
      navigator.clipboard.writeText(tsContent).then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
      });
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; 
        fileInputRef.current.click();
    }
  };

  const handleClearData = () => {
    if (confirm("⚠️ 警告：此操作将清空本地缓存。\n\n注意：如果 initialData.ts 文件中仍有数据，刷新页面后它们可能会再次出现。")) {
        StorageService.clearDB();
        window.location.reload();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('PROCESSING');
    setErrorMsg('');

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const json = event.target?.result;
        if (typeof json !== 'string') throw new Error("无法读取文件内容");

        const data = JSON.parse(json);

        const txCount = data.ledger?.transactions?.length || 0;
        const journalCount = data.journal?.length || 0;
        
        if (!window.confirm(`解析成功！\n\n账单: ${txCount} 条\n日记: ${journalCount} 篇\n\n确定导入吗？`)) {
            setImportStatus('IDLE');
            return;
        }

        const result = StorageService.importBackup(data);

        if (result.success) {
            setImportStatus('SUCCESS');
            setTimeout(() => window.location.reload(), 500);
        } else {
            throw new Error(result.message);
        }

      } catch (err: any) {
        setImportStatus('ERROR');
        setErrorMsg(err.message || "未知解析错误");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border-4 border-amber-200">
        
        <div className="bg-amber-100 p-6 border-b border-amber-200 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg">
                <Database className="w-6 h-6 text-amber-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">工程数据管理</h2>
                <p className="text-sm text-amber-700">Codebase Persistence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-amber-800" />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Section 1: Code Persistence (Primary Solution) */}
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 space-y-5">
            <div className="space-y-2">
                <h3 className="font-bold text-blue-800 flex items-center text-lg">
                    <FileDown className="w-5 h-5 mr-2" />
                    生成并导出数据 (TS)
                </h3>
            </div>

            {/* LIVE DATA PREVIEW DASHBOARD */}
            {stats && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm flex items-center space-x-3">
                        <div className="bg-yellow-100 p-2 rounded-full">
                            <TrendingUp className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">待导出账单</p>
                            <p className="text-lg font-bold text-gray-800">{stats.tx} <span className="text-xs font-normal text-gray-400">笔</span></p>
                        </div>
                    </div>
                     <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm flex items-center space-x-3">
                        <div className="bg-pink-100 p-2 rounded-full">
                            <BookHeart className="w-4 h-4 text-pink-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">待导出日记</p>
                            <p className="text-lg font-bold text-gray-800">{stats.journal} <span className="text-xs font-normal text-gray-400">篇</span></p>
                        </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end space-x-1 text-xs text-gray-400 px-1">
                        <Clock className="w-3 h-3" />
                        <span>数据版本时间戳: {new Date(stats.ts).toLocaleString()}</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                    onClick={handleDownloadTS}
                    className="flex justify-center items-center space-x-2 px-3 py-3 rounded-xl font-bold transition-all shadow-md bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                >
                    <FileDown className="w-5 h-5" />
                    <span>生成新 TS 文件</span>
                </button>

                <button 
                    onClick={handleCopyForCodebase}
                    className={`flex justify-center items-center space-x-2 px-3 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95 ${
                        copySuccess ? 'bg-green-500 text-white' : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                    }`}
                >
                    {copySuccess ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    <span>{copySuccess ? '已复制' : '复制代码'}</span>
                </button>
            </div>
            
             <p className="text-[10px] text-center text-blue-400">
                下载后请手动覆盖项目中的 data/initialData.ts
            </p>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Section 2: JSON Backup */}
          <div className="space-y-4 opacity-75 hover:opacity-100 transition-opacity">
            <h3 className="font-bold text-gray-700 flex items-center text-sm">
                <Download className="w-4 h-4 mr-2" />
                传统 JSON 备份
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={handleExportJSON}
                    className="flex justify-center items-center space-x-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium"
                >
                    <Download className="w-4 h-4" />
                    <span>下载 JSON</span>
                </button>

                <div className="relative">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                    <button 
                        onClick={handleImportClick}
                        className="w-full flex justify-center items-center space-x-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium"
                    >
                        {importStatus === 'PROCESSING' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span>导入 JSON</span>
                    </button>
                </div>
            </div>
          </div>

          <div className="border-t border-gray-100"></div>
          
          <div className="text-center">
             <button 
                onClick={handleClearData}
                className="text-red-400 hover:text-red-600 text-xs flex items-center justify-center w-full space-x-1"
            >
                <Trash2 className="w-3 h-3" />
                <span>清空本地缓存 (Reset Local)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
