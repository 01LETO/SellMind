import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function uploadFiles({ allowedMimeTypes = [], fieldName = 'files', maxCount = 10 } = {}) {
	const upload = multer({
		storage: multer.memoryStorage(),
		limits: { fileSize: MAX_FILE_SIZE },
		fileFilter: (_req, file, cb) => {
			if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
				return cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
			}
			cb(null, true);
		},
	});

	return upload.array(fieldName, maxCount);
}
