import { randomInt } from 'node:crypto';

const LOWERCASE = 'abcdefghijkmnpqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const LOWERCASE_COUNT = 5;

const pick = (chars) => chars[randomInt(chars.length)];

// Cumple la política de auth: mayúscula, minúscula, dígito y carácter especial.
export default function genTempPassword() {
    let password = pick(UPPERCASE);
    for (let i = 0; i < LOWERCASE_COUNT; i++) password += pick(LOWERCASE);
    return password + pick(DIGITS) + '!';
}
