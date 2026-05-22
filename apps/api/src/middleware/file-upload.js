import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MAGIC_CHECKERS = {
	'image/jpeg': (buf) => buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF,
	'image/png': (buf) => buf.length >= 8 &&
		buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
		buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A,
	'image/webp': (buf) => buf.length >= 12 &&
		buf.slice(0, 4).toString('ascii') === 'RIFF' &&
		buf.slice(8, 12).toString('ascii') === 'WEBP',
};

export function validateMagicBytes(file) {
	const check = MAGIC_CHECKERS[file.mimetype];
	if (!check) return false;
	return check(file.buffer);
}

export function uploadFiles({ allowedMimeTypes = [], fieldName = 'files', maxCount = 10 } = {}) {
	const upload = multer({
		storage: multer.memoryStorage(),
		limits: { fileSize: MAX_FILE_SIZE },
		fileFilter: (_req, file, cb) => {
			if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
				return cb(Object.assign(new Error('Tipo de arquivo não permitido.'), { status: 400 }));
			}
			cb(null, true);
		},
	});

	return upload.array(fieldName, maxCount);
}
