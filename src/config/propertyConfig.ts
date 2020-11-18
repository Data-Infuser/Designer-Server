const propertyJson = require("../../property.json");

const jobqueueRedis_origin = propertyJson['jobqueueRedis'];
const uploadDist_origin = propertyJson['uploadDist'];
const redis_origin = propertyJson['redis'];
const server_origin = propertyJson['server'];
const auth_origin = propertyJson['auth'];

const uploadDist = {
    type: process.env.DESIGNER_UPLOAD_DIST_TYPE || uploadDist_origin.type,
    localPath: process.env.DESIGNER_UPLOAD_DIST_LOCAL_PATH || uploadDist_origin.localPath,
    awsConfigPath: process.env.LOADER_UPLOAD_AWS_CONFIG_PATH || uploadDist_origin.awsConfigPath,
    s3Bucket: process.env.LOADER_UPLOAD_S3_BUCKET || uploadDist_origin.s3Bucket
}
const server = {
    host: process.env.DESIGNER_SERVER_HOST || server_origin.host,
    port: process.env.DESIGNER_SERVER_PORT || server_origin.port,
    grpcPort: process.env.DESIGNER_SERVER_GRPC_PORT || server_origin.grpcPort,
}
const auth = {
    host: process.env.DESIGNER_AUTH_HOST || auth_origin.host,
    grpcPort: process.env.DESIGNER_AUTH_PORT || auth_origin.grpcPort
}
const jobqueueRedis = {
    host: process.env.DESIGNER_JOB_QUEUE_HOST || jobqueueRedis_origin.host,
    port: process.env.DESIGNER_JOB_QUEUE_PORT || jobqueueRedis_origin.port,
}
const redis = {
    host: process.env.DESIGNER_REDIS_HOST || redis_origin.host,
    port: process.env.DESIGNER_REDIS_PORT || redis_origin.port,
}

const propertyConfigs = {
    uploadDist,
    server,
    auth,
    jobqueueRedis,
    redis
}
  
export default propertyConfigs;