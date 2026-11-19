export function getJwtSecret() {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret || secret.length < 16) {
        throw new Error('FATAL: JWT_SECRET no está configurado o es menor a 16 caracteres en .env');
    }
    return secret;
}