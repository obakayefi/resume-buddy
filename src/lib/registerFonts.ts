/**
 * registerFonts.ts
 *
 * Font registration for @react-pdf/renderer.
 * Uses embedded base64 Inter fonts to guarantee reliable rendering
 * without runtime network dependencies, CORS issues, or unsupported format errors.
 */
import { Font } from '@react-pdf/renderer';
import { INTER_REGULAR, INTER_BOLD } from './interFontData';

let registered = false;

export async function registerInterFont(): Promise<void> {
  if (registered) return;

  try {
    Font.register({
      family: 'Inter',
      fonts: [
        { src: INTER_REGULAR, fontWeight: 'normal', fontStyle: 'normal' },
        { src: INTER_BOLD, fontWeight: 'bold', fontStyle: 'normal' },
      ],
    });
    registered = true;
  } catch (error) {
    console.warn('Could not register Inter font for PDF renderer:', error);
  }
}


