import { Op } from 'sequelize';

export default function checkInRange(from, to) {
    if (!from && !to) return {};
    const check_in = {};
    if (from) check_in[Op.gte] = new Date(from);
    if (to) check_in[Op.lte] = new Date(to);
    return { check_in };
}
