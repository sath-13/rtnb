import mongoose from 'mongoose';

const typeOfWorkSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

const TypeOfWork = mongoose.model('TypeOfWork', typeOfWorkSchema);

//Added these values during app startup
TypeOfWork.ensureDefaults = async () => {
  const defaultTypes = ['Internal', 'Probable', 'Confirmed', 'PaperTask'];

  for (const name of defaultTypes) {
    await TypeOfWork.findOneAndUpdate(
      { name },
      { name },
      { upsert: true, new: true }
    );
  }
};

export default TypeOfWork;
