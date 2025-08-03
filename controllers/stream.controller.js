// controllers/stream.controller.js

import { ReviewMessages, streamMessages } from '../constants/enums.js';
import Streams from '../models/stream-model.js';

export const createStream = async (req, res) => {
    try {
        const { streamTitle, workspaceName } = req.body;

        if (streamTitle === "Personal_Stream") {
            const existingStream = await Streams.findOne({ streamTitle: "Personal_Stream", workspaceName });
            if (existingStream) {
                return res.status(200).json({ msg: streamMessages.PERSONAL_STREAM_EXISTS, stream: existingStream });
            }
        }

        // Ensure only one instance is created
        const existing = await Streams.findOne({ streamTitle, workspaceName });
        if (existing) {
            return res.status(400).json({ msg: streamMessages.STREAM_ALREADY_EXISTS });
        }

        const newStream = new Streams({ streamTitle, workspaceName });
        await newStream.save();

        res.status(201).json({ msg: streamMessages.STREAM_CREATED, stream: newStream });
    } catch (err) {
        console.error(streamMessages.STREAM_CREATE_ERR, err);
        res.status(500).json({ msg: streamMessages.STREAM_CREATE_ERR, error: err.message });
    }
};

export const getStreamsInWorkspace = async (req, res) => {
    try {
        const { workspaceName } = req.params;
        const streams = await Streams.find({ workspaceName });
        res.status(200).json(streams);
       
    } catch (err) {
        console.error(ReviewMessages.ERROR_FETCHING_STREAMS, err);
        res.status(500).json({ msg: ReviewMessages.ERROR_FETCHING_STREAMS , error: err.message });
    }
};

export const deleteStreamFromWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedStream = await Streams.findByIdAndDelete(id);

        if (!deletedStream) {
            return res.status(404).json({ msg: ReviewMessages.STREAM_NOT_FOUND});
        }

        res.status(200).json({ msg: ReviewMessages.STREAM_DELETED_SUCCESSFULLY });
    } catch (err) {
        console.error(ReviewMessages.ERROR_DELETING_STREAM, err);
        res.status(500).json({ msg: ReviewMessages.ERROR_DELETING_STREAM, error: err.message });
    }
};


// Update a stream
export const updateStream = async (req, res) => {
    try {
      const { id } = req.params;
      const { streamTitle } = req.body;

      const updatedStream = await Streams.findByIdAndUpdate(id, { streamTitle }, { new: true });
  
      if (!updatedStream) {
        return res.status(404).json({ message: ReviewMessages.STREAM_NOT_FOUND });
      }
  
      res.json({ message: ReviewMessages.STREAM_UPDATED_SUCCESSFULLY, stream: updatedStream });
    } catch (error) {
      res.status(500).json({ message: ReviewMessages.ERROR_UPDATING_STREAM, error: error.message });
      console.error(error);
    }
  };