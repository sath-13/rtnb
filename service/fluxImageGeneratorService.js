import AWS from "aws-sdk";
import config from "../config.js";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY_ID,
  region: config.AWS_REGION,
});

const s3 = new AWS.S3();

export const getSignedUrl = async (s3Key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key,
    Expires: 31536000, 
  };

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (err) {
    console.error('Error generating signed URL', err);
    throw null;
  }
};
