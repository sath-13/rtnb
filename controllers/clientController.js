import StatusCodes from 'http-status-codes';
import Client from '../models/clientModel.js';
import {
  BadRequest,
  InternalServer,
} from '../middlewares/customError.js';
import { ClientMessages } from '../constants/enums.js';
import multer from "multer";


// Store uploaded images in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export default upload;


export const getAllClients = async (req, res, next) => {
  try {
    const clients = await Client.find();
    res.status(StatusCodes.OK).json({
      clients,
      message: ClientMessages.CLIENTS_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ClientMessages.ERROR_FETCHING_CLIENTS));
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return next(BadRequest(ClientMessages.CLIENT_NOT_FOUND));
    }
    res.status(StatusCodes.OK).json({
      client,
      message: ClientMessages.CLIENT_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ClientMessages.ERROR_FETCHING_CLIENT));
  }
};

export const createClient = async (req, res, next) => {
  try {
    const newClient = new Client(req.body);
    const savedClient = await newClient.save();
    res.status(StatusCodes.CREATED).json({
      client: savedClient,
      message: ClientMessages.CLIENT_CREATED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ClientMessages.ERROR_CREATING_CLIENT));
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const updatedClient = await Client.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );
    if (!updatedClient) {
      return next(BadRequest(ClientMessages.CLIENT_NOT_FOUND));
    }
    res.status(StatusCodes.OK).json({
      client: updatedClient,
      message: ClientMessages.CLIENT_UPDATED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ClientMessages.ERROR_UPDATING_CLIENT));
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) {
      return next(BadRequest(ClientMessages.CLIENT_NOT_FOUND));
    }
    res.status(StatusCodes.OK).json({
      message: ClientMessages.CLIENT_DELETED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ClientMessages.ERROR_DELETING_CLIENT));
  }
};

// export const uploadClientImage = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const imageFile = req.file ?? "";
//     const image = imageFile ? imageFile : null;
//     let image_url = null;
//     if (image) {
//       image_url = await uploadImageToS3(image.path, "image");
//     }
//     const client = await Client.findOneAndUpdate(
//       { _id: id },
//       { image: image_url },
//       {
//         new: true,
//       }
//     );
//     if (client && image) {
//       deleteLocalFile(image)
//         .catch((err) => {
//           console.error("Failed to delete client image file:", err);
//         });
//     }
//     return res.status(StatusCodes.OK).json({
//       message: ClientMessages.CLIENT_IMAGE_UPLOAD_SUCCESSFULLY,
//       client,
//     });
//   } catch (error) {
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       message: ClientMessages.ERROR_UPLOADING_CLIENT_IMAGE,
//     });
//   }
// };

export const uploadClientImage = async (req, res) => {
  try {
    const { id } = req.params;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ClientMessages.NO_IMAGE_UPLOADED,
      });
    }

    // Convert image to Base64 format
    const mimeType = imageFile.mimetype;
    if (!["image/png", "image/jpeg"].includes(mimeType)) {
      return res.status(400).json({ message: "Invalid file type" });
    }

    const imageBase64 = `data:${mimeType};base64,${imageFile.buffer.toString("base64")}`;

    
    const clientExists = await Client.findById(id);
   

    if (!clientExists) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: ClientMessages.CLIENT_NOT_FOUND,
      });
    }


    // Update client with Base64 image
    const client = await Client.findByIdAndUpdate(
      id,
      { $set: { image: imageBase64 } },
      { new: true, runValidators: true }
    );

    const updatedClient = await Client.findById(id);
  

    return res.status(StatusCodes.OK).json({
      message: ClientMessages.CLIENT_IMAGE_UPLOAD_SUCCESSFULLY,
      client: updatedClient, // Ensure latest data is returned
    });
  } catch (error) {
    console.error(ClientMessages.ERROR_UPLOADING_CLIENT_IMAGE, error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: ClientMessages.ERROR_UPLOADING_CLIENT_IMAGE,
    });
  }
};




export const deleteClientImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) {
      return next(BadRequest(ClientMessages.CLIENT_NOT_FOUND));
    }
    await Client.findByIdAndUpdate(
      id,
      {
        image: "",
      },
      { new: true }
    );
    return res.status(StatusCodes.OK).json({
      message: ClientMessages.CLIENT_IMAGE_DELETED_SUCCESSFULLY
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: ClientMessages.ERROR_DELETING_CLIENT_IMAGE,
    });
  }
};