import { useState, useCallback } from 'react';
import { parseCSVFile, validateCSVStructure } from '@/services/csvParser';
import type { CSVRow } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [csvData, setCsvData] = useState<CSVRow[] | null>(null);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const data = await parseCSVFile(file);
      const validation = validateCSVStructure(data);
      
      if (!validation.isValid) {
        toast({
          title: "Invalid CSV structure",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      setCsvData(data);
      toast({
        title: "File uploaded successfully",
        description: `Parsed ${data.length} rows from ${file.name}`,
      });
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const clearData = useCallback(() => {
    setCsvData(null);
  }, []);

  return {
    isUploading,
    csvData,
    uploadFile,
    clearData,
  };
};
