export const sendSuccess = (data, message = 'Success') => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};
export const sendError = (message, error) => {
    return {
        success: false,
        message,
        error,
        timestamp: new Date().toISOString()
    };
};
export const sendPaginated = (data, page, limit, total, message = 'Success') => {
    return {
        success: true,
        message,
        data,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
    };
};
