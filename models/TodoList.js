import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  recurring: { type: Boolean, default: false },
  date: { type: String, required: true }, // "YYYY-MM-DD"
});

const TodoList = mongoose.model('TodoList', taskSchema);

export default TodoList;
