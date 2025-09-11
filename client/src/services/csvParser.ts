import Papa from 'papaparse';
import type { CSVRow } from '@/types';

export const parseCSVFile = (file: File): Promise<CSVRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          return;
        }

        try {
          const parsedData = results.data.map((row: any) => ({
            id: row.id || '',
            name: row.name || '',
            format: row.format || '',
            quantity: parseInt(row.quantity || '1', 10),
            finish: row.finish || 'nonFoil',
            publicUrl: row.publicUrl,
            description: row.description,
            info: {
              name: row['info.name'] || '',
              set: row['info.set'],
              set_name: row['info.set_name'],
              scryfall_id: row['info.scryfall_id'],
              mana_cost: row['info.mana_cost'],
              cmc: parseFloat(row['info.cmc']) || 0,
              type_line: row['info.type_line'],
              rarity: row['info.rarity'],
            },
          }));

          // Filter out rows without essential data
          const validData = parsedData.filter(
            (row) => row.name && row.info.name
          );

          resolve(validData);
        } catch (error) {
          reject(new Error(`Data processing error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      },
      error: (error) => {
        reject(new Error(`File reading error: ${error.message}`));
      },
    });
  });
};

export const validateCSVStructure = (data: CSVRow[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (data.length === 0) {
    errors.push('CSV file is empty');
    return { isValid: false, errors };
  }

  // Check for required columns
  const requiredFields = ['name', 'info.name'];
  const firstRow = data[0];
  
  for (const field of requiredFields) {
    if (field === 'info.name') {
      if (!firstRow.info?.name) {
        errors.push(`Missing required field: ${field}`);
      }
    } else if (!firstRow[field as keyof CSVRow]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check if we have deck names
  const deckNames = new Set(data.map(row => row.name));
  if (deckNames.size === 0) {
    errors.push('No valid deck names found');
  }

  // Check if we have card names
  const cardNames = new Set(data.map(row => row.info?.name).filter(Boolean));
  if (cardNames.size === 0) {
    errors.push('No valid card names found');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
