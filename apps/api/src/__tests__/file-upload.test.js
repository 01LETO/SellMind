import { describe, it, expect } from 'vitest';
import { validateMagicBytes } from '../middleware/file-upload.js';

function makeFile(mimeType, bytes) {
	return { mimetype: mimeType, buffer: Buffer.from(bytes) };
}

const JPEG_MAGIC = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10];
const PNG_MAGIC = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
const WEBP_MAGIC = [
	0x52, 0x49, 0x46, 0x46, // RIFF
	0x00, 0x00, 0x00, 0x00, // file size (irrelevant)
	0x57, 0x45, 0x42, 0x50, // WEBP
];
const EXE_MAGIC = [0x4D, 0x5A, 0x00, 0x00]; // MZ (Windows executable)

describe('validateMagicBytes', () => {
	describe('JPEG', () => {
		it('aceita buffer com magic bytes corretos', () => {
			expect(validateMagicBytes(makeFile('image/jpeg', JPEG_MAGIC))).toBe(true);
		});

		it('rejeita buffer com magic bytes incorretos', () => {
			expect(validateMagicBytes(makeFile('image/jpeg', EXE_MAGIC))).toBe(false);
		});

		it('rejeita buffer vazio', () => {
			expect(validateMagicBytes(makeFile('image/jpeg', []))).toBe(false);
		});
	});

	describe('PNG', () => {
		it('aceita buffer com magic bytes corretos', () => {
			expect(validateMagicBytes(makeFile('image/png', PNG_MAGIC))).toBe(true);
		});

		it('rejeita buffer com magic bytes incorretos', () => {
			expect(validateMagicBytes(makeFile('image/png', JPEG_MAGIC))).toBe(false);
		});
	});

	describe('WebP', () => {
		it('aceita buffer com magic bytes corretos', () => {
			expect(validateMagicBytes(makeFile('image/webp', WEBP_MAGIC))).toBe(true);
		});

		it('rejeita buffer RIFF sem assinatura WEBP', () => {
			const riffNotWebp = [
				0x52, 0x49, 0x46, 0x46,
				0x00, 0x00, 0x00, 0x00,
				0x41, 0x56, 0x49, 0x20, // AVI
			];
			expect(validateMagicBytes(makeFile('image/webp', riffNotWebp))).toBe(false);
		});
	});

	describe('tipo desconhecido', () => {
		it('rejeita MIME type não reconhecido', () => {
			expect(validateMagicBytes(makeFile('application/pdf', [0x25, 0x50, 0x44, 0x46]))).toBe(false);
		});
	});

	describe('MIME type forjado', () => {
		it('rejeita arquivo EXE declarado como JPEG', () => {
			expect(validateMagicBytes(makeFile('image/jpeg', EXE_MAGIC))).toBe(false);
		});

		it('rejeita arquivo PNG declarado como JPEG', () => {
			expect(validateMagicBytes(makeFile('image/jpeg', PNG_MAGIC))).toBe(false);
		});
	});
});
