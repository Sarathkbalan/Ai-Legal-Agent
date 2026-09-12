const express = require('express');
const router = express.Router();

const documentRoutes = require('./documentRoutes');
const researchRoutes = require('./researchRoutes');
const auditRoutes = require('./auditRoutes');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/research', researchRoutes);
router.use('/audit', auditRoutes);
router.use('/health', healthRoutes);

module.exports = router;
