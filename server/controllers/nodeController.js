const { Node, Closure } = require('../models');

exports.getTable = async (req, res) => {
  try {
    const { parentId = null, limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    // Récupérer les enfants directs du nœud parent
    const nodes = await Node.findAll({
      attributes: ['id', 'name', 'type', 'created_at', 'updated_at'],
      include: [
        {
          model: Closure,
          as: 'ancestors',
          where: { 
            ancestor_id: parentId || null,
            depth: 1
          },
          required: parentId ? true : false
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['updated_at', 'DESC']]
    });
    
    // Récupérer le total pour la pagination
    const count = await Node.count({
      include: [
        {
          model: Closure,
          as: 'ancestors',
          where: { 
            ancestor_id: parentId || null,
            depth: 1
          },
          required: parentId ? true : false
        }
      ]
    });
    
    return res.status(200).json({
      nodes,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        current: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return res.status(500).json({ error: 'Failed to fetch nodes' });
  }
};

exports.getNodePath = async (req, res) => {
  try {
    const { nodeId } = req.params;
    
    // Récupérer le chemin du nœud actuel jusqu'à la racine
    const path = await Closure.findAll({
      where: { descendant_id: nodeId },
      include: [
        {
          model: Node,
          as: 'ancestor',
          attributes: ['id', 'name', 'type']
        }
      ],
      order: [['depth', 'ASC']]
    });
    
    return res.status(200).json(path.map(p => p.ancestor));
  } catch (error) {
    console.error('Error fetching node path:', error);
    return res.status(500).json({ error: 'Failed to fetch node path' });
  }
};

exports.getAllNodes = async (req, res) => {
  try {
    const nodes = await Node.findAll();
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNodeTree = async (req, res) => {
  try {
    // Implémentation à compléter
    res.json({ message: "Not implemented yet" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNodeById = async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id);
    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }
    res.json(node);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNodeChildren = async (req, res) => {
  try {
    // Implémentation à compléter
    res.json({ message: "Not implemented yet" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNodeParent = async (req, res) => {
  try {
    // Implémentation à compléter
    res.json({ message: "Not implemented yet" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNodeAncestors = async (req, res) => {
  try {
    // Implémentation à compléter
    res.json({ message: "Not implemented yet" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNodeDescendants = async (req, res) => {
  try {
    // Implémentation à compléter
    res.json({ message: "Not implemented yet" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createNode = async (req, res) => {
  try {
    // Implémentation à compléter
    res.json({ message: "Not implemented yet" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateNode = async (req, res) => {
  try {
    // Implémentation à compléter
    res.json({ message: "Not implemented yet" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteNode = async (req, res) => {
  try {
    // Implémentation à compléter
    res.json({ message: "Not implemented yet" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};