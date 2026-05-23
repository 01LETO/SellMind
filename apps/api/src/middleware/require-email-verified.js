export function requireEmailVerified(req, res, next) {
	if (!req.supabaseUserId) return next();

	if (!req.supabaseUser?.email_confirmed_at) {
		return res.status(403).json({
			error: 'E-mail não verificado. Confirme seu e-mail antes de continuar.',
			code: 'EMAIL_NOT_VERIFIED',
		});
	}

	return next();
}
