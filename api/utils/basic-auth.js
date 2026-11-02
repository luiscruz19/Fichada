export const basicAuth = ({ USER, PASSWORD }) =>
    'Basic ' + Buffer.from(`${USER}:${PASSWORD}`).toString('base64');
