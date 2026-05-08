import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SaveShareService {
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Saves a calculation result to localStorage
   * @param key The unique identifier for the calculation type (e.g., 'amortization', 'mp2')
   * @param data The data object to save
   */
  saveCalculation(key: string, data: any): boolean {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const existingDataStr = localStorage.getItem('phcalc_saved');
        let existingData = existingDataStr ? JSON.parse(existingDataStr) : {};
        
        if (!existingData[key]) {
          existingData[key] = [];
        }
        
        // Add timestamp
        data.savedAt = new Date().toISOString();
        
        existingData[key].push(data);
        localStorage.setItem('phcalc_saved', JSON.stringify(existingData));
        return true;
      } catch (e) {
        console.error('Error saving to localStorage', e);
        return false;
      }
    }
    return false;
  }

  /**
   * Retrieves saved calculations from localStorage
   * @param key The calculation type
   */
  getSavedCalculations(key: string): any[] {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const existingDataStr = localStorage.getItem('phcalc_saved');
        if (existingDataStr) {
          const existingData = JSON.parse(existingDataStr);
          return existingData[key] || [];
        }
      } catch (e) {
        console.error('Error reading from localStorage', e);
      }
    }
    return [];
  }

  /**
   * Generates a shareable URL string by base64 encoding the parameters
   * @param data The data object to share
   * @returns A query string to append to the URL (e.g., ?data=base64string)
   */
  generateShareLink(data: any): string {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const jsonString = JSON.stringify(data);
        const encoded = btoa(encodeURIComponent(jsonString));
        
        // Get the base URL without query parameters
        const url = new URL(window.location.href);
        return `${url.origin}${url.pathname}?data=${encoded}`;
      } catch (e) {
        console.error('Error generating share link', e);
        return '';
      }
    }
    return '';
  }

  /**
   * Decodes shared data from the URL if present
   * @param encodedData The base64 encoded string from the 'data' query param
   */
  decodeSharedData(encodedData: string): any {
    if (encodedData) {
      try {
        const jsonString = decodeURIComponent(atob(encodedData));
        return JSON.parse(jsonString);
      } catch (e) {
        console.error('Error decoding shared data', e);
        return null;
      }
    }
    return null;
  }
}
