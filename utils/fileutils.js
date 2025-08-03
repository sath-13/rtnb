  export const generateFileURL = (req, fileName) => {
  const cleanName = fileName.replace(/^uploads[\\/]/, '');
  return `${req.protocol}://${req.get("host")}/uploads/${cleanName}`;
};
