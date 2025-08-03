import fs from "fs";

export const deleteLocalFile = async (file) => {
  return new Promise((resolve, reject) => {
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error(`Error deleting file: ${file.path}`, err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}