export const validateRequest = (schema, part = 'params') => {
    return (req, res, next) => {
        const result = schema.safeParse(req[part]);
        if (!result.success) {
            const errors = result.error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
            }));
            res.status(400).json({ message: 'Parámetros inválidos', errors });
            return;
        }
        // Overwrite the parsed part with the validated (and potentially transformed) data
        req[part] = result.data;
        next();
    };
};
