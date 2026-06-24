import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ResumeUploader({ file, uploadProgress = 0, loading = false, onFileChange, onUpload }) {
  return (
    <div className="space-y-5">
      <label className="block rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 transition-colors hover:border-white/25">
        <span className="flex items-center gap-3 text-sm font-medium text-slate-200">
          <UploadCloud className="h-5 w-5 text-brand-200" />
          Upload PDF or DOCX resume
        </span>
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#fff]"
        />
        <p className="mt-3 text-xs text-slate-500">{file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : 'Maximum file size: 5MB'}</p>
      </label>

      {loading || uploadProgress > 0 ? (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-brand-400 transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-xs text-slate-500">{uploadProgress}% uploaded</p>
        </div>
      ) : null}

      <Button type="button" onClick={onUpload} isLoading={loading} disabled={!file}>
        Upload and parse resume
      </Button>
    </div>
  );
}
