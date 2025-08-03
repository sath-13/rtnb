import AssetCategory from '../models/AssetCategoryModel.js';
import AssetType from '../models/AssetTypeModel.js';

// CATEGORY CONTROLLERS
export const getCategories = async (req, res) => {
  try {
    const categories = await AssetCategory.find();
    const withCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await AssetType.countDocuments({ categoryId: cat._id });
        return { ...cat.toObject(), count };
      })
    );
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addCategory = async (req, res) => {
  try {
    const category = new AssetCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// TYPE CONTROLLERS
export const getTypesByCategory = async (req, res) => {
  try {
    const types = await AssetType.find({ categoryId: req.params.categoryId });
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addType = async (req, res) => {
  try {
    const type = new AssetType(req.body);
    await type.save();
    res.status(201).json(type);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateType = async (req, res) => {
  try {
    const updated = await AssetType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteType = async (req, res) => {
  try {
    await AssetType.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const updateCategory = async (req, res) => {
  try {
    const updated = await AssetCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await AssetCategory.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

