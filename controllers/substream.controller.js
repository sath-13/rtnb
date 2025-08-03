import { SubstreamMessages } from "../constants/enums.js";
import SubStream from "../models/substream-model.js";

export const fetchSubStreamsByStream = async (streamTitle,workspacename) => {
  try {


      if (!streamTitle || !workspacename) {
          throw new Error(SubstreamMessages.STREAM_TITLE_REQ);
      }

      return await SubStream.find({ streamTitle, workspacename });  
  } catch (err) {
      console.error(SubstreamMessages.ERROR_FETCHING_STREAMS, err);
      return [];
  }
};

export const createSubStream = async (req, res) => {
  const { subStreamTitle, description,streamTitle ,workspacename } = req.body;

  try {

    if (!streamTitle) {
      return res.status(400).json({ msg: SubstreamMessages.STREAM_NAME_REQUIRED });
    }

    const newSubStream = new SubStream({
        subStreamTitle, description,streamTitle,workspacename
    });

    await newSubStream.save();

    res.status(201).json({ msg: SubstreamMessages.SUB_STREAM_CREATD_EMAIL_SENT, subStream: newSubStream });
  } catch (err) {
    console.error(SubstreamMessages.ERROR_CREATING_SUBSTREAM, err);
    res.status(500).json({ msg: SubstreamMessages.ERROR_CREATING_SUBSTREAM, error: err.message });
  }
};
 
export const getSubStreamInStream = async (req, res) => {
  try {

      const { streamTitle ,workspacename} = req.query;  //Use req.query instead of req.params
      if (!streamTitle || !workspacename) {
          return res.status(400).json({ msg: SubstreamMessages.STREAM_TITLE_REQ });
      }
      const subStreams = await SubStream.find({ streamTitle ,workspacename});
      res.status(200).json(subStreams);
  } catch (err) {
      console.error(SubstreamMessages.ERROR_FETCHING_STREAMS, err);
      res.status(500).json({ msg: SubstreamMessages.ERROR_FETCHING_STREAMS, error: err.message });
  }
};

export const deleteSubStreamInStream = async (req, res) => {
  try {
      const { id } = req.params;
      const deletedSubStream = await SubStream.findByIdAndDelete(id);

      if (!deletedSubStream) {
          return res.status(404).json({ msg:SubstreamMessages.STREAM_NOT_FOUND });
      }

      res.status(200).json({ msg: SubstreamMessages.STREAM_DELETED_SUCCESSFULLY });
  } catch (err) {
      console.error(SubstreamMessages.ERROR_DELETING_STREAM, err);
      res.status(500).json({ msg: SubstreamMessages.ERROR_DELETING_STREAM , error: err.message });
  }
};

// Update a sub-stream
export const updateSubStream = async (req, res) => {
  try {
    const { id } = req.params;
    const { subStreamTitle, description } = req.body;
    const updatedSubStream = await SubStream.findByIdAndUpdate(id, { subStreamTitle, description }, { new: true });

    if (!updatedSubStream) {
      return res.status(404).json({ message: SubstreamMessages.STREAM_NOT_FOUND });
    }

    res.json({ message: SubstreamMessages.SUB_STREAM_UPDATED_SUCC , subStream: updatedSubStream });
  } catch (error) {
    res.status(500).json({ message: SubstreamMessages.SUB_STREAM_UPDATE_ERR, error: error.message });
  }
};
