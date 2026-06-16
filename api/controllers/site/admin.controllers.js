import Site from '../../models/Site.js';
import { successMessage, errorMessage } from '../../utils/messages.js';

// ==================== LISTAR SEDES ====================
export async function listSites(req, res) {
    try {
        const { status } = req.query;
        const where = {};
        if (status) where.status = status;

        const sites = await Site.findAll({ where, order: [['name', 'ASC']] });
        return res.status(200).json(successMessage({ extra: { data: sites } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al listar las sedes', extra: { error: error.message }
        }));
    }
}

// ==================== OBTENER SEDE ====================
export async function getSite(req, res) {
    try {
        const site = await Site.findByPk(req.params.id);
        if (!site) return res.status(404).json(errorMessage({ message: 'Sede no encontrada' }));
        return res.status(200).json(successMessage({ extra: { data: site } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener la sede', extra: { error: error.message }
        }));
    }
}

// ==================== CREAR SEDE ====================
export async function createSite(req, res) {
    try {
        const { name, address, lat, lng, radius_meters } = req.body;
        const site = await Site.create({
            name,
            address: address ?? null,
            lat: lat ?? null,
            lng: lng ?? null,
            radius_meters: radius_meters ?? null,
            created_by: req.employee?.id ?? null,
        });
        return res.status(201).json(successMessage({ message: 'Sede creada', extra: { data: site } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al crear la sede', extra: { error: error.message }
        }));
    }
}

// ==================== ACTUALIZAR SEDE ====================
export async function updateSite(req, res) {
    try {
        const site = await Site.findByPk(req.params.id);
        if (!site) return res.status(404).json(errorMessage({ message: 'Sede no encontrada' }));

        const { name, address, lat, lng, radius_meters, status } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (address !== undefined) updates.address = address;
        if (lat !== undefined) updates.lat = lat;
        if (lng !== undefined) updates.lng = lng;
        if (radius_meters !== undefined) updates.radius_meters = radius_meters;
        if (status !== undefined) updates.status = status;

        await site.update(updates);
        return res.status(200).json(successMessage({ message: 'Sede actualizada', extra: { data: site } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al actualizar la sede', extra: { error: error.message }
        }));
    }
}

// ==================== ELIMINAR SEDE ====================
export async function deleteSite(req, res) {
    try {
        const site = await Site.findByPk(req.params.id);
        if (!site) return res.status(404).json(errorMessage({ message: 'Sede no encontrada' }));
        await site.destroy();
        return res.status(200).json(successMessage({ message: 'Sede eliminada' }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al eliminar la sede', extra: { error: error.message }
        }));
    }
}
