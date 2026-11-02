// `iat` viene en segundos; una sesión emitida antes del corte deja de valer aunque no haya vencido.
export default function isTokenRevoked(employee, tokenPayload) {
    if (!employee?.tokens_valid_after) return false;
    const issuedAtMs = (tokenPayload?.iat ?? 0) * 1000;
    return issuedAtMs < new Date(employee.tokens_valid_after).getTime();
}
