const propertyJson = require("../../property.json");

const jobqueueRedis_origin = propertyJson['jobqueueRedis'];
const uploadDist_origin = propertyJson['uploadDist'];
const grpc_origin = propertyJson['grpc'];
const redis_origin = propertyJson['redis'];

const uploadDist = {
    type: process.env.DESIGNER_UPLOAD_DIST_TYPE || uploadDist_origin.type,
    localPath: process.env.DESIGNER_UPLOAD_DIST_LOCAL_PATH || uploadDist_origin.localPath,
    awsConfigPath:  process.env.DESIGNER_UPLOAD_AWS_CONFIG_PATH || uploadDist_origin.awsConfigPath,
    s3Bucket: process.env.DESIGNER_UPLOAD_S3_BUCKET || uploadDist_origin.s3Bucket
}

const server = {
    host: process.env.DESIGNER_HOST || propertyJson.host,
    port: process.env.DESIGNER_PORT || propertyJson.port,
    grpcPort: process.env.DESIGNER_GRPC_PORT || propertyJson.grpcPort
}

const jobqueueRedis = {
    host: process.env.DESIGNER_JOB_QUEUE_HOST || jobqueueRedis_origin.host,
    port: process.env.DESIGNER_JOB_QUEUE_PORT || jobqueueRedis_origin.port
}

const redis = { 
    host: process.env.DESIGNER_REDIS_HOST || redis_origin.host,
    port: process.env.DESIGNER_REDIS_PORT || redis_origin.port
}

const grpc = {
    auth: {
        host: process.env.GRPC_AUTHOR_HOST || grpc_origin.auth.host,
        port: process.env.GRPC_AUTHOR_PORT || grpc_origin.auth.port
    }
}

const propertyConfigs = {
    server,
    redis,
    uploadDist,
    jobqueueRedis,
    grpc
}

export default propertyConfigs;