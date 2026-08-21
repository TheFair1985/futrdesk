import { describe, it, expect } from 'vitest';
import { textToHtml } from '../lib/email/plunk';

describe('textToHtml', () => {
  it('wraps paragraphs and converts single newlines to <br>', () => {
    const result = textToHtml('Erste Zeile\nZweite Zeile\n\nNeuer Absatz');
    expect(result).toBe('<p>Erste Zeile<br>Zweite Zeile</p><p>Neuer Absatz</p>');
  });

  it('returns a single paragraph for plain text', () => {
    expect(textToHtml('Hallo')).toBe('<p>Hallo</p>');
  });
});
