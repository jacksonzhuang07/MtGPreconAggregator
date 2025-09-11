import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileUploadProps {
  onFileProcessed: (data: any[]) => void;
  isDisabled?: boolean;
}

export function FileUpload({ onFileProcessed, isDisabled }: FileUploadProps) {
  const { isUploading, csvData, uploadFile } = useFileUpload();

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  }, [uploadFile]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, [uploadFile]);

  const handleAnalyze = useCallback(() => {
    if (csvData) {
      onFileProcessed(csvData);
    }
  }, [csvData, onFileProcessed]);

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Upload className="text-primary h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload MTG Precon Data</h3>
          <p className="text-muted-foreground mb-4">
            Upload your CSV file containing precon deck card data to begin analysis
          </p>
          
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 bg-accent/50 hover:bg-accent/70 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-testid="file-upload-area"
          >
            <input 
              type="file" 
              id="csvFile" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileChange}
              disabled={isUploading || isDisabled}
              data-testid="input-csv-file"
            />
            <label htmlFor="csvFile" className="cursor-pointer">
              <FileSpreadsheet className="mx-auto text-3xl text-muted-foreground mb-2 h-12 w-12" />
              <p className="text-sm font-medium">
                {isUploading ? 'Processing...' : 'Click to upload CSV file'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or drag and drop your file here
              </p>
            </label>
          </div>
          
          {csvData && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ Successfully loaded {csvData.length} rows from CSV
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Found {new Set(csvData.map(row => row.name)).size} unique decks
              </p>
            </div>
          )}
          
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={handleAnalyze}
              disabled={!csvData || isUploading || isDisabled}
              className="flex items-center space-x-2"
              data-testid="button-analyze"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Analyze Precon Prices</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
