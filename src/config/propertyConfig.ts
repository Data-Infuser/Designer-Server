const propertyJson = require("../../property.json");

const uploadDist_origin = propertyJson['uploadDist'];

const uploadDist = {
    type: process.env.LOADER_UPLOAD_DIST_TYPE || uploadDist_origin.type,
    localPath: process.env.LOADER_UPLOAD_DIST_LOCAL_PATH || uploadDist_origin.localPath,
    awsConfigPath:  process.env.LOADER_UPLOAD_AWS_CONFIG_PATH || uploadDist_origin.awsConfigPath,
    s3Bucket: process.env.LOADER_UPLOAD_S3_BUCKET || uploadDist_origin.s3Bucket
}

const propertyConfigs = {
    uploadDist
}

export default propertyConfigs;